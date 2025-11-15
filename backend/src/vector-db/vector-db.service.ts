import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
// @ts-ignore: No type definitions for Pinecone SDK (v6 currently no official types)
import { Pinecone } from '@pinecone-database/pinecone';
import * as process from 'process';

import {
  BaseVectorMetadata,
  UpsertVectorItem,
  QueryVectorOptions,
} from './vector-db.types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VectorDbService {
  private pinecone: Pinecone | null = null;
  private indexName = '';
  private readonly logger = new Logger(VectorDbService.name);
  private dimension: number | null = null;
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.bootstrap();
    const key = process.env.OPENAI_API_KEY ?? '';
    this.openai = new OpenAI({ apiKey: key });
  }

  private bootstrap() {
    const apiKey = process.env.PINECONE_API_KEY ?? '';
    this.indexName = process.env.PINECONE_INDEX ?? '';
    if (!apiKey || !this.indexName) {
      this.logger.warn(
        'Pinecone 초기화 건너뜀: API KEY 또는 INDEX 이름이 설정되지 않았습니다.',
      );
      return;
    }
    try {
      this.pinecone = new Pinecone({ apiKey });
      this.logger.log(`Pinecone 초기화 완료 (index=${this.indexName})`);
    } catch (e: any) {
      this.logger.error('Pinecone 초기화 실패', e?.message);
      this.pinecone = null;
    }
  }

  private ensureReady(): boolean {
    if (!this.pinecone || !this.indexName) {
      return false;
    }
    return true;
  }

  // ====== Public Vector Operations ======
  async upsert(items: UpsertVectorItem[]): Promise<void> {
    if (!items.length) return;
    if (!this.ensureReady()) {
      this.logger.debug('upsert 호출됨 - Pinecone 비활성 상태, 무시');
      return;
    }
    // 차원 고정 검사
    if (!this.dimension) {
      this.dimension = items[0].values.length;
    } else if (items.some((i) => i.values.length !== this.dimension)) {
      this.logger.warn(
        '벡터 차원 불일치: 일부 항목이 기록된 dimension과 다릅니다. upsert 진행은 시도합니다.',
      );
    }
    await this.withRetry(async () => {
      const index = this.pinecone!.index(this.indexName);
      await index.upsert(
        items.map((i) => ({
          id: i.id,
          values: i.values,
          metadata: i.metadata,
        })),
      );
    }, 'upsert');
  }

  async query<TMeta = any>(opts: QueryVectorOptions): Promise<any[]> {
    if (!this.ensureReady()) {
      this.logger.debug('query 호출됨 - Pinecone 비활성 상태, 빈 배열 반환');
      return [];
    }
    return await this.withRetry(
      async () => {
        const index = this.pinecone!.index(this.indexName);
        const result = await index.query({
          vector: opts.vector,
          topK: opts.topK,
          includeMetadata: opts.includeMetadata ?? true,
          filter: opts.filter,
        });
        return result.matches || [];
      },
      'query',
      [] as any[],
    );
  }

  async delete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    if (!this.ensureReady()) return;
    await this.withRetry(async () => {
      const index = this.pinecone!.index(this.indexName);
      try {
        await index.deleteMany(ids);
      } catch (e: any) {
        // 일부 SDK 버전 차이 대응: deleteMany 없을 경우 delete
        try {
          // @ts-ignore
          await index.delete({ ids });
        } catch (inner: any) {
          throw inner;
        }
      }
    }, 'delete');
  }

  // 단순 재시도 유틸 (고정 백오프)
  private async withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    fallback?: T,
    maxAttempts = 3,
    delayMs = 150,
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (e: any) {
        attempt++;
        if (attempt >= maxAttempts) {
          this.logger.warn(
            `Pinecone ${label} 실패 (최대 재시도 초과): ${e?.message}`,
          );
          if (fallback !== undefined) return fallback;
          throw e;
        }
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
    // 논리적으로 도달 불가
    return fallback as T;
  }

  /**
   * Pinecone에서 userId 기반 임베딩 유사도 검색으로 주간 트렌드 토픽 추출
   */
  async getWeeklyTrendTopics(userId: string, limit = 2): Promise<string[]> {
    try {
      // 최근 7일 일기 수집 (최대 100개)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const journals = await this.prisma.journal.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        // NOTE: prisma generate 후 embedding 필드 추가 가능
        select: {
          id: true,
          content: true,
          emotionScore: true,
          createdAt: true,
        },
      });
      if (!journals.length) return this.getDefaultTrendTopics();

      // 임베딩 확보 (간소: 재계산; 추후 캐싱/저장 최적화 가능)
      const embeddings: { id: string; emb: number[] }[] = [];
      for (const j of journals) {
        const existingEmb: number[] | undefined = (j as any).embedding;
        if (existingEmb && existingEmb.length) {
          embeddings.push({ id: j.id, emb: existingEmb });
          continue;
        }
        const e = await this.generateGeminiEmbedding(j.content);
        if (e) {
          embeddings.push({ id: j.id, emb: e });
          // prisma generate 후 정상 반영 (embedding 필드) 예상
          this.prisma.journal
            .update({ where: { id: j.id }, data: { embedding: e } })
            .catch((err: any) =>
              this.logger.debug('임베딩 저장 실패: ' + err.message),
            );
        }
      }
      if (embeddings.length < 2) return this.getDefaultTrendTopics();

      // K 결정 (√(n/2) 범위 2~6 제한)
      const n = embeddings.length;
      const k = Math.max(2, Math.min(6, Math.round(Math.sqrt(n / 2))));
      this.logger.debug(
        `TrendTopic: journals=${journals.length}, embeddings=${embeddings.length}, k=${k}`,
      );

      const vectors = embeddings.map((e) => e.emb);
      const clusterResult = this.kmeans(vectors, k, 15); // 최대 15 epoch

      // 각 클러스터 텍스트 결합 & 키워드 추출
      const clusterSummaries: { topic: string; score: number }[] = [];
      const clusters: Record<
        number,
        { texts: string[]; emotions: number[]; createdAts: Date[] }
      > = {};
      embeddings.forEach((e, idx) => {
        const c = clusterResult.assignments[idx];
        if (!clusters[c])
          clusters[c] = { texts: [], emotions: [], createdAts: [] };
        clusters[c].texts.push(journals[idx].content);
        clusters[c].emotions.push(journals[idx].emotionScore ?? 0);
        clusters[c].createdAts.push(journals[idx].createdAt);
      });

      for (const [cid, obj] of Object.entries(clusters)) {
        // 짧은 일기 필터 (15자 미만 제거)
        const filtered = obj.texts.filter((t) => t.trim().length >= 15);
        if (!filtered.length) continue;
        const combined = filtered.join('\n');
        // LLM 키워드 요약 시도 -> 실패 시 빈도 기반
        let topics = await this.summarizeClusterWithLLM(combined);
        if (!topics.length) {
          const keywords = this.extractKeywords(combined, 3);
          topics = keywords;
        }
        const topic = topics.slice(0, 3).join('/');
        // 감정 가중치: 평균 |emotionScore| (0~?) -> 1 + avg/10
        const avgEmotion = obj.emotions.length
          ? obj.emotions.reduce((a, b) => a + Math.abs(b), 0) /
            obj.emotions.length
          : 0;
        // 최신 가중치: 가장 최근 createdAt 기준 exp(-λ * days)
        const latest = obj.createdAts.reduce(
          (a, b) => (a > b ? a : b),
          obj.createdAts[0],
        );
        const days = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.exp(-0.25 * days); // λ=0.25
        const score = filtered.length * (1 + avgEmotion / 10) * recencyWeight;
        clusterSummaries.push({ topic: topic || '일상', score });
      }

      clusterSummaries.sort((a, b) => b.score - a.score);
      const top = clusterSummaries
        .slice(0, limit)
        .map((c) => c.topic)
        .filter(Boolean);
      return top.length ? top : this.getDefaultTrendTopics();
    } catch (error: any) {
      this.logger.warn('트렌드 토픽 산출 실패: ' + error.message);
      return this.getDefaultTrendTopics();
    }
  }

  /**
   * 기본 트렌드 토픽 (Pinecone 실패시 사용)
   */
  private getDefaultTrendTopics(): string[] {
    const defaultTopics = [
      '감사',
      '성장',
      '도전',
      '관계',
      '행복',
      '변화',
      '꿈',
      '일상',
      '건강',
      '학습',
      '가족',
      '친구',
      '취미',
      '여행',
      '음식',
    ];

    // 랜덤하게 2개 선택
    const shuffled = defaultTopics.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }

  /**
   * Gemini Embedding API 호출 (텍스트 → 벡터)
   */
  private async generateGeminiEmbedding(
    text: string,
  ): Promise<number[] | null> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;
    const payload = {
      model: 'models/embedding-001',
      content: { parts: [{ text }] },
    };
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return null;
      const result = await response.json();
      // Gemini 임베딩 결과 구조: { embedding: { values: number[] } }
      return result.embedding?.values || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 여러 텍스트(일기/피드백 등)를 받아 평균 임베딩 벡터 반환
   */
  async getCombinedEmbedding(texts: string[]): Promise<number[] | null> {
    if (!texts.length) return null;
    const embeddings: number[][] = [];
    for (const text of texts) {
      const emb = await this.generateGeminiEmbedding(text);
      if (emb) embeddings.push(emb);
    }
    if (!embeddings.length) return null;
    // 벡터 평균
    const dim = embeddings[0].length;
    const avg = Array(dim).fill(0);
    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        avg[i] += emb[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avg[i] /= embeddings.length;
    }
    return avg;
  }

  // ====== 간단 KMeans 구현 (소규모 데이터용) ======
  private kmeans(
    data: number[][],
    k: number,
    maxEpoch = 10,
  ): { centroids: number[][]; assignments: number[] } {
    if (data.length === 0) return { centroids: [], assignments: [] };
    const dim = data[0].length;
    // 초기 centroid: 앞 k개 (개수가 모자라면 중복)
    const centroids = Array.from({ length: k }, (_, i) =>
      data[i % data.length].slice(),
    );
    const assignments = new Array(data.length).fill(0);
    const distance = (a: number[], b: number[]) => {
      let s = 0;
      for (let i = 0; i < dim; i++) {
        const d = a[i] - b[i];
        s += d * d;
      }
      return s; // 제곱거리
    };
    for (let epoch = 0; epoch < maxEpoch; epoch++) {
      let changed = false;
      // 할당 단계
      for (let i = 0; i < data.length; i++) {
        let best = 0;
        let bestDist = Infinity;
        for (let c = 0; c < k; c++) {
          const d = distance(data[i], centroids[c]);
          if (d < bestDist) {
            bestDist = d;
            best = c;
          }
        }
        if (assignments[i] !== best) {
          assignments[i] = best;
          changed = true;
        }
      }
      // 변경 없으면 조기 종료
      if (!changed && epoch > 0) break;
      // 업데이트 단계
      const sums = Array.from({ length: k }, () => Array(dim).fill(0));
      const counts = Array(k).fill(0);
      for (let i = 0; i < data.length; i++) {
        const a = assignments[i];
        counts[a]++;
        const v = data[i];
        for (let d = 0; d < dim; d++) sums[a][d] += v[d];
      }
      for (let c = 0; c < k; c++) {
        if (counts[c] === 0) continue; // 빈 클러스터는 유지
        for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
      }
    }
    return { centroids, assignments };
  }

  // ====== 키워드 추출 (아주 간단한 빈도 기반) ======
  private extractKeywords(text: string, topN: number): string[] {
    const stop = new Set([
      '그리고',
      '그',
      '이',
      '저',
      '것',
      '에서',
      '하다',
      '했다',
      '있는',
      '위해',
      '오늘',
      '정말',
      '너무',
      '해서',
      '하며',
      '하면서',
      '했다',
      '하지만',
      '또',
    ]);
    const freq: Record<string, number> = {};
    const tokens = text
      .replace(/[^\p{L}\p{N}\s]/gu, ' ') // 문자/숫자/공백 외 제거
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && t.length <= 15);
    for (const tok of tokens) {
      if (stop.has(tok)) continue;
      freq[tok] = (freq[tok] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map((e) => e[0]);
  }

  // ====== LLM 기반 클러스터 요약 (GPT API) ======
  private async summarizeClusterWithLLM(text: string): Promise<string[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.debug('OpenAI API 키 없음: LLM 요약 건너뜀');
      return [];
    }

    // 텍스트 길이 제한 (과도한 토큰 방지)
    const truncated = text.length > 4000 ? text.slice(0, 4000) : text;
    const systemPrompt =
      '당신은 한국어 텍스트에서 핵심 주제 키워드를 짧게 뽑아내는 도우미입니다.';
    const userPrompt = `다음 일기 묶음의 공통 주제를 2~3개 한글 키워드로만 쉼표로 구분하여 출력:
${truncated}`;

    try {
      // GPT-5 responses API 시도
      const gpt5Result = await this.tryGPT5ResponsesAPI(
        userPrompt,
        systemPrompt,
      );
      if (gpt5Result.length > 0) {
        this.logger.debug(`GPT-5 responses API 성공: ${gpt5Result.join(', ')}`);
        return gpt5Result;
      }
    } catch (error: any) {
      this.logger.debug(
        `GPT-5 responses API 실패, 폴백 시도: ${error.message}`,
      );
    }

    try {
      // 폴백: GPT-4o chat completions API
      const gpt4Result = await this.tryGPTChatCompletionsAPI(
        userPrompt,
        systemPrompt,
      );
      if (gpt4Result.length > 0) {
        this.logger.debug(
          `GPT-4o chat completions API 성공: ${gpt4Result.join(', ')}`,
        );
        return gpt4Result;
      }
    } catch (error: any) {
      this.logger.debug(`모든 GPT API 실패: ${error.message}`);
    }

    return [];
  }

  private async tryGPT5ResponsesAPI(
    userPrompt: string,
    systemPrompt: string,
  ): Promise<string[]> {
    // GPT-5 responses API via OpenAI client
    try {
      const input = [
        {
          role: 'developer',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
      ];
      const resp = await this.openai.responses.create({
        model: 'gpt-5',
        input,
        text: { format: { type: 'text' }, verbosity: 'medium' },
        reasoning: { effort: 'medium', summary: 'auto' },
        tools: [],
        store: false,
      } as any);
      return this.parseGPT5Response(resp);
    } catch (error: any) {
      throw error;
    }
  }

  private parseGPT5Response(response: any): string[] {
    // 1. output_text 최우선
    if (
      typeof response.output_text === 'string' &&
      response.output_text.trim()
    ) {
      return this.parseKeywordsFromText(response.output_text.trim());
    }

    // 2. output 배열에서 message → content[] → output_text
    if (Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item?.type === 'message' && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (
              c?.type === 'output_text' &&
              typeof c.text === 'string' &&
              c.text.trim()
            ) {
              return this.parseKeywordsFromText(c.text.trim());
            }
          }
        }
      }
    }

    // 3. 기타 텍스트 필드 후보
    const fallbackCandidates = [
      response?.content,
      response?.text?.content,
      response?.message?.content,
      response?.choices?.[0]?.message?.content,
    ];

    for (const candidate of fallbackCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return this.parseKeywordsFromText(candidate.trim());
      }
    }

    throw new Error('GPT-5 응답에서 텍스트를 찾을 수 없음');
  }

  private async tryGPTChatCompletionsAPI(
    userPrompt: string,
    systemPrompt: string,
  ): Promise<string[]> {
    // GPT-4o chat completions API via OpenAI client
    try {
      const resp = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 50,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      });
      const content = resp.choices?.[0]?.message?.content || '';
      if (!content.trim()) throw new Error('GPT-4o 응답이 비어있음');
      return this.parseKeywordsFromText(content.trim());
    } catch (error: any) {
      throw error;
    }
  }

  private parseKeywordsFromText(text: string): string[] {
    return text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
  }
}

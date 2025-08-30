import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore: No type definitions for Pinecone SDK (v6 currently no official types)
import { Pinecone } from '@pinecone-database/pinecone';
import * as process from 'process';

import { BaseVectorMetadata, UpsertVectorItem, QueryVectorOptions } from './vector-db.types';

@Injectable()
export class VectorDbService {
  private pinecone: Pinecone | null = null;
  private indexName = '';
  private readonly logger = new Logger(VectorDbService.name);
  private dimension: number | null = null; // 최초 upsert 시 차원 기록

  constructor() {
    this.bootstrap();
  }

  private bootstrap() {
    const apiKey = process.env.PINECONE_API_KEY ?? '';
    this.indexName = process.env.PINECONE_INDEX ?? '';
    if (!apiKey || !this.indexName) {
      this.logger.warn('Pinecone 초기화 건너뜀: API KEY 또는 INDEX 이름이 설정되지 않았습니다.');
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
    } else if (items.some(i => i.values.length !== this.dimension)) {
      this.logger.warn('벡터 차원 불일치: 일부 항목이 기록된 dimension과 다릅니다. upsert 진행은 시도합니다.');
    }
    await this.withRetry(async () => {
      const index = this.pinecone!.index(this.indexName);
      await index.upsert(items.map(i => ({ id: i.id, values: i.values, metadata: i.metadata })));
    }, 'upsert');
  }

  async query<TMeta = any>(opts: QueryVectorOptions): Promise<any[]> {
    if (!this.ensureReady()) {
      this.logger.debug('query 호출됨 - Pinecone 비활성 상태, 빈 배열 반환');
      return [];
    }
    return await this.withRetry(async () => {
      const index = this.pinecone!.index(this.indexName);
      const result = await index.query({
        vector: opts.vector,
        topK: opts.topK,
        includeMetadata: opts.includeMetadata ?? true,
        filter: opts.filter,
      });
      return result.matches || [];
    }, 'query', [] as any[]);
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
  private async withRetry<T>(fn: () => Promise<T>, label: string, fallback?: T, maxAttempts = 3, delayMs = 150): Promise<T> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (e: any) {
        attempt++;
        if (attempt >= maxAttempts) {
          this.logger.warn(`Pinecone ${label} 실패 (최대 재시도 초과): ${e?.message}`);
          if (fallback !== undefined) return fallback;
          throw e;
        }
        await new Promise(r => setTimeout(r, delayMs * attempt));
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
      // 1. Pinecone 연결 확인
      if (!this.ensureReady()) {
        this.logger.debug('Pinecone 비활성: 기본 트렌드 토픽 반환');
        return this.getDefaultTrendTopics();
      }

      // 2. 최근 일기/피드백 등에서 텍스트 추출 (여기선 예시)
      const userContext = `user:${userId}`;

      // 3. Gemini Embedding API 호출 (예시)
      const embedding = await this.generateGeminiEmbedding(userContext);
      if (!embedding) {
        console.log('임베딩 생성 실패. 기본 트렌드 토픽을 반환합니다.');
        return this.getDefaultTrendTopics();
      }

      // 4. Pinecone에서 유사도 검색
      const matches = await this.query({ vector: embedding, topK: limit, includeMetadata: true });

      // 5. 결과에서 trend topic 추출 (metadata.topic)
      const topics = (matches || [])
        .map((match: any) => match.metadata?.topic)
        .filter((t: string | undefined) => !!t);

      // 6. 결과가 있으면 반환, 없으면 기본값
      return topics.length > 0 ? topics : this.getDefaultTrendTopics();
    } catch (error: any) {
      this.logger.warn('벡터 DB 트렌드 조회 중 오류 발생: ' + error.message);
      return this.getDefaultTrendTopics();
    }
  }

  /**
   * 기본 트렌드 토픽 (Pinecone 실패시 사용)
   */
  private getDefaultTrendTopics(): string[] {
    const defaultTopics = [
      '감사', '성장', '도전', '관계', '행복',
      '변화', '꿈', '일상', '건강', '학습',
      '가족', '친구', '취미', '여행', '음식'
    ];
    
    // 랜덤하게 2개 선택
    const shuffled = defaultTopics.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }

  /**
   * Gemini Embedding API 호출 (텍스트 → 벡터)
   */
  private async generateGeminiEmbedding(text: string): Promise<number[] | null> {
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
}

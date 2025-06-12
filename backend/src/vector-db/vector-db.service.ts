import { Injectable } from '@nestjs/common';
// @ts-ignore: No type definitions for Pinecone SDK
import { Pinecone } from '@pinecone-database/pinecone';
import * as process from 'process';

@Injectable()
export class VectorDbService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY ?? '';
    this.indexName = process.env.PINECONE_INDEX ?? '';
    // Pinecone Node.js SDK v6+: 환경(environment)은 index 생성 시만 필요, 클라이언트에는 apiKey만 필요
    this.pinecone = new Pinecone({ apiKey });
  }

  /**
   * Pinecone에서 userId 기반 임베딩 유사도 검색으로 주간 트렌드 토픽 추출
   */
  /**
   * Gemini API를 활용한 임베딩 벡터 생성 및 Pinecone 유사도 검색
   */
  async getWeeklyTrendTopics(userId: string, limit = 2): Promise<string[]> {
    // 1. 최근 일기/피드백 등에서 텍스트 추출 (여기선 예시)
    const userContext = `user:${userId}`;

    // 2. Gemini Embedding API 호출 (예시)
    const embedding = await this.generateGeminiEmbedding(userContext);
    if (!embedding) {
      // fallback: 임시 벡터
      return ['감사', '성장'];
    }

    // 3. Pinecone에서 유사도 검색
    const index = this.pinecone.index(this.indexName);
    const queryResult = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
    });

    // 4. 결과에서 trend topic 추출 (metadata.topic)
    const topics = (queryResult.matches || [])
      .map((match: any) => match.metadata?.topic)
      .filter((t: string | undefined) => !!t);

    // fallback: 없으면 mock
    if (topics.length === 0) return ['감사', '성장'];
    return topics;
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

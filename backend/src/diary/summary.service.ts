import { Injectable } from '@nestjs/common';
import { SummaryGeneratorFactory } from './summary/summary-generator.factory';

/**
 * DiarySummaryService (리팩터링 버전)
 * - SummaryGeneratorFactory 를 통해 모델별 요약 제너레이터(Gemini/GPT/Claude 등)를 선택
 * - 기존 단일 Gemini 호출 로직을 추상화하여 확장 용이
 * - 실패/미설정 시 원문 반환 (기능 저하 graceful degradation)
 */
@Injectable()
export class DiarySummaryService {
  private readonly DEFAULT_MODEL = 'gemini-2.5-flash';
  // 간단한 메모리 캐시: key = SHA256(content + modelId + maxChars)
  private cache = new Map<string, { value: { text: string; modelUsed: string; truncated: boolean; fallbackUsed: boolean }; ts: number }>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 10; // 10분

  // 사용자별 분당 호출 수 제한 (메모리)
  private rateBuckets = new Map<string, { count: number; windowStart: number }>();
  private readonly RATE_LIMIT_PER_MIN = 5;

  private hash(input: string) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private checkRateLimit(userId?: string) {
    if (!userId) return true; // 사용자 없음(시스템 호출) 예외
    const now = Date.now();
    const bucket = this.rateBuckets.get(userId);
    if (!bucket) {
      this.rateBuckets.set(userId, { count: 1, windowStart: now });
      return true;
    }
    if (now - bucket.windowStart > 60_000) {
      bucket.count = 1;
      bucket.windowStart = now;
      return true;
    }
    if (bucket.count >= this.RATE_LIMIT_PER_MIN) return false;
    bucket.count += 1;
    return true;
  }

  async summarize(rawContent: string, options?: { title?: string; maxChars?: number; modelId?: string; userId?: string }): Promise<{ text: string; modelUsed: string; truncated: boolean; fallbackUsed: boolean; rateLimited?: boolean; cached?: boolean }> {
    const modelId = options?.modelId || this.DEFAULT_MODEL;
    const maxChars = options?.maxChars ?? 1200;
    const looksLikeQA = /(\?|:).*\n/.test(rawContent) || /\n\n.+\n\n/.test(rawContent);

    // Rate limit
    if (!this.checkRateLimit(options?.userId)) {
      return { text: rawContent, modelUsed: modelId, truncated: false, fallbackUsed: true, rateLimited: true };
    }

    // Cache lookup
    const cacheKey = this.hash(`${modelId}|${maxChars}|${rawContent}`);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
      return { ...cached.value, cached: true };
    } else if (cached) {
      this.cache.delete(cacheKey);
    }

    try {
      const res = await SummaryGeneratorFactory.summarizeWithMeta({
        rawContent,
        title: options?.title,
        maxChars,
        looksLikeQA,
        modelId,
      });
      const value = { text: res.text, modelUsed: res.modelUsed, truncated: res.truncated, fallbackUsed: res.fallbackUsed };
      this.cache.set(cacheKey, { value, ts: Date.now() });
      return value;
    } catch (e: any) {
      console.warn('[DiarySummaryService] summarize 실패 - 원문 폴백', e?.message || e);
      return { text: rawContent, modelUsed: modelId, truncated: false, fallbackUsed: true };
    }
  }
}

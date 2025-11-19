import { Injectable } from '@nestjs/common';
import { BaseService } from '../logger/base.service';

@Injectable()
export class RateCacheService extends BaseService {
  private buckets = new Map<string, { count: number; windowStart: number }>();
  private cache = new Map<string, { value: any; ts: number }>();

  constructor() {
    super(RateCacheService.name);
  }

  isAllowed(key: string, perMin: number): boolean {
    const now = Date.now();
    const b = this.buckets.get(key);
    if (!b) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return true;
    }
    if (now - b.windowStart > 60_000) {
      b.count = 1;
      b.windowStart = now;
      return true;
    }
    if (b.count >= perMin) {
      this.logger.debug(`rate limit exceeded key=${key}`);
      return false;
    }
    b.count += 1;
    return true;
  }

  getCache<T>(key: string, ttlMs: number): T | undefined {
    const c = this.cache.get(key);
    if (!c) return undefined;
    if (Date.now() - c.ts > ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return c.value as T;
  }

  setCache<T>(key: string, value: T) {
    this.cache.set(key, { value, ts: Date.now() });
  }
}

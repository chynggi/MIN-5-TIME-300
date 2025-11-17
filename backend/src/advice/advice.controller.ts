import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdviceService } from './advice.service';
import { RateCacheService } from '../common/services/rate-cache.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt') as any)
@Controller('api/v1/advice')
export class AdviceController {
  constructor(
    private readonly service: AdviceService,
    private readonly rate: RateCacheService,
  ) {}

  @Get('latest')
  async latest(@Req() req: any) {
    const userId = req.user.userId;
    // 10분 단기 캐시
    const cacheKey = `advice_latest:${userId}`;
    const cached = this.rate.getCache<any>(cacheKey, 10 * 60 * 1000);
    if (cached) {
      // 캐시 적중 로그는 RateCacheService 내부 또는 글로벌 로거에서 확인 가능
      return cached;
    }
    const latest = await this.service.getLatest(userId);
    const fallback = {
      id: undefined,
      advice: '작게 시작해도 좋아요—오늘은 5분만 쉬어가요.',
      risk_flag: 'none' as const,
      tags: ['루틴'],
      createdAt: new Date().toISOString(),
      cached: true,
    };
    const payload = latest
      ? { ...latest, cached: false }
      : fallback;
    this.rate.setCache(cacheKey, payload);
    return payload;
  }

  @Post('generate')
  async generate(@Req() req: any, @Query('force') force?: string) {
    const userId = req.user.userId;
    if (!this.rate.isAllowed(`advice_gen:${userId}`, 3)) {
      throw new HttpException(
        '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const f = String(force || '').toLowerCase() === 'true';
    const result = await this.service.generateWithCache(userId, f);
    this.rate.setCache(`advice_latest:${userId}`, { ...result, cached: false });
    return result;
  }

  @Post('feedback')
  async feedback(
    @Req() req: any,
    @Body() body: { adviceId: string; helpful: boolean },
  ) {
    const userId = req.user.userId;
    if (!body?.adviceId || typeof body.helpful !== 'boolean') {
      return {
        ok: false,
        message: 'adviceId와 helpful(boolean)가 필요합니다.',
      };
    }
    const res = await this.service.feedback(
      userId,
      body.adviceId,
      body.helpful,
    );
    return { ok: true, ...res };
  }

  // 캐시 무효화(강제 재생성): 일기 제출 후 호출 가능
  @Post('invalidate')
  async invalidate(@Req() req: any) {
    const userId = req.user.userId;
    if (!this.rate.isAllowed(`advice_inv:${userId}`, 3)) {
      throw new HttpException(
        '요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const result = await this.service.generateWithCache(userId, true);
    this.rate.setCache(`advice_latest:${userId}`, { ...result, cached: false });
    return { ok: true, ...result };
  }
}

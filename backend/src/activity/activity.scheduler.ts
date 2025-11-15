import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityScheduler {
  private readonly logger = new Logger(ActivityScheduler.name);
  constructor(private readonly activityService: ActivityService) {}

  // 매일 새벽 03:10 (서버 시간) 감쇠
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'Asia/Seoul' })
  async handleDailyDecay() {
    this.logger.log('활동지수 Daily Decay 시작');
    const start = Date.now();
    await this.activityService.dailyDecayAll();
    this.logger.log(`활동지수 Daily Decay 완료 (${Date.now() - start}ms)`);
  }
}

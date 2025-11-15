import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma.service';
import { ActivityController } from './activity.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityScheduler } from './activity.scheduler';
import { StreakBadgeService } from './streak-badge.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [RealtimeModule, NotificationModule],
  controllers: [ActivityController],
  providers: [
    ActivityService,
    PrismaService,
    ActivityScheduler,
    StreakBadgeService,
  ],
  exports: [ActivityService, StreakBadgeService],
})
export class ActivityModule {}

import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma.service';
import { ActivityController } from './activity.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityScheduler } from './activity.scheduler';

@Module({
  imports: [RealtimeModule],
  controllers: [ActivityController],
  providers: [ActivityService, PrismaService, ActivityScheduler],
  exports: [ActivityService],
})
export class ActivityModule {}

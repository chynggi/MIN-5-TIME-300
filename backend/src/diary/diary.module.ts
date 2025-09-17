import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';
import { FileUploadService } from '../common/services/file-upload.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityModule } from '../activity/activity.module';
import { DiarySummaryService } from './summary.service';
import { AdviceModule } from '../advice/advice.module';
import { StreakBadgeService } from '../activity/streak-badge.service';

@Module({
  imports: [PrismaModule, VectorDbModule, RealtimeModule, ActivityModule, AdviceModule],
  controllers: [DiaryController],
  providers: [DiaryService, FileUploadService, DiarySummaryService, StreakBadgeService],
  exports: [DiaryService],
})
export class DiaryModule {}

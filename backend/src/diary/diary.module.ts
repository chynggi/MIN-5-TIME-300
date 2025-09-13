import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';
import { FileUploadService } from '../common/services/file-upload.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityModule } from '../activity/activity.module';
import { DiarySummaryService } from './summary.service';

@Module({
  imports: [PrismaModule, VectorDbModule, RealtimeModule, ActivityModule],
  controllers: [DiaryController],
  providers: [DiaryService, FileUploadService, DiarySummaryService],
  exports: [DiaryService],
})
export class DiaryModule {}

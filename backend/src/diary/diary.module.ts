import { Module, forwardRef } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';
import { FileUploadService } from '../common/services/file-upload.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivityModule } from '../activity/activity.module';
import { DiarySummaryService } from './summary.service';
import { AdviceModule } from '../advice/advice.module';
import { QuestionModule } from '../question/question.module';
// StreakBadgeService는 ActivityModule에서 export 되므로 여기서 직접 provider로 등록하지 않습니다.

@Module({
  imports: [
    PrismaModule,
    VectorDbModule,
    RealtimeModule,
    ActivityModule,
    AdviceModule,
    forwardRef(() => QuestionModule),
  ],
  controllers: [DiaryController],
  providers: [DiaryService, FileUploadService, DiarySummaryService],
  exports: [DiaryService],
})
export class DiaryModule {}

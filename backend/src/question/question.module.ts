import { Module, forwardRef } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';
import { ProfileModule } from '../profile/profile.module';
import { DiaryModule } from '../diary/diary.module';
import { RateCacheService } from '../common/services/rate-cache.service';

@Module({
  imports: [
    PrismaModule,
    VectorDbModule,
    ProfileModule,
    forwardRef(() => DiaryModule),
  ],
  controllers: [QuestionController],
  providers: [QuestionService, RateCacheService],
  exports: [QuestionService], // Export QuestionService so it can be used in DiaryModule
})
export class QuestionModule {}

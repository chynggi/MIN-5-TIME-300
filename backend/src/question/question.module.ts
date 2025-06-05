import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaModule } from '../prisma.module';

import { ProfileService } from '../profile/profile.service';
import { DiaryService } from '../diary/diary.service';
@Module({
  imports: [PrismaModule],
  controllers: [QuestionController],
  providers: [QuestionService, ProfileService, DiaryService]
})
export class QuestionModule {}

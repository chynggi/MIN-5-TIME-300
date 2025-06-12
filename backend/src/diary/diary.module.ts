import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';

@Module({
  imports: [PrismaModule, VectorDbModule],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}

import { Module } from '@nestjs/common';
import { DiariesController } from './diaries.controller';
import { DiariesService } from './diaries.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiariesController],
  providers: [DiariesService],
  exports: [DiariesService],
})
export class DiariesModule {}
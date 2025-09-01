import { Module } from '@nestjs/common';
import { VectorDbService } from './vector-db.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VectorDbService],
  exports: [VectorDbService],
})
export class VectorDbModule {}

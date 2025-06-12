import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaModule } from '../prisma.module';
import { VectorDbModule } from '../vector-db/vector-db.module';

@Module({
  imports: [PrismaModule, VectorDbModule],
  controllers: [CommunityController],
  providers: [CommunityService]
})
export class CommunityModule {}

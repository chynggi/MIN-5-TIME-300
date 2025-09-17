import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AdviceService } from './advice.service';
import { AdviceController } from './advice.controller';
import { NotificationModule } from '../notification/notification.module';
import { RateCacheService } from '../common/services/rate-cache.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [AdviceService, RateCacheService],
  controllers: [AdviceController],
  exports: [AdviceService],
})
export class AdviceModule {}

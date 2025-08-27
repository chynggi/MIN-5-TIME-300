import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FollowController],
  providers: [FollowService, NotificationService],
  exports: [FollowService],
})
export class FollowModule {}
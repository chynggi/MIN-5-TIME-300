import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [CheckinService],
  controllers: [CheckinController],
  exports: [CheckinService],
})
export class CheckinModule {}

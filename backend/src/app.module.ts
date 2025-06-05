import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { DiaryModule } from './diary/diary.module';
import { QuestionModule } from './question/question.module';
import { CommunityModule } from './community/community.module';
import { FriendModule } from './friend/friend.module';
import { ChatModule } from './chat/chat.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProfileModule,
    DiaryModule,
    QuestionModule,
    CommunityModule,
    FriendModule,
    ChatModule,
    StatisticsModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

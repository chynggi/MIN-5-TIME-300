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
import { Community2Module } from './community2/community2.module';
import { ChatGateway } from './chat/chat.gateway';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // .env에 JWT_SECRET=your_secret_key
      signOptions: { expiresIn: '1d' },
    }),
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
    Community2Module,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}

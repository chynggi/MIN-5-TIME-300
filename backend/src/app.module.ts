import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { DiaryModule } from './diary/diary.module';
import { QuestionModule } from './question/question.module';
import { FriendModule } from './friend/friend.module';
import { FollowModule } from './follow/follow.module';
import { SocialModule } from './social/social.module';
import { ChatModule } from './chat/chat.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma.module';
import { UsersModule } from './users/users.module';
import { ChatGateway } from './chat/chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ActivityModule } from './activity/activity.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SpotifyModule } from './spotify/spotify.module';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // .env에 JWT_SECRET=your_secret_key
      signOptions: { expiresIn: '1d' },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProfileModule,
    DiaryModule,
    QuestionModule,
    FriendModule,
    FollowModule,
    SocialModule,
    ChatModule,
    StatisticsModule,
    NotificationModule,
    UsersModule,
    RealtimeModule,
  ActivityModule,
  SpotifyModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}

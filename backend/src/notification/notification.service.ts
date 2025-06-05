import { Injectable } from '@nestjs/common';
import { NotificationSettingsDto, UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(req: any): Promise<NotificationSettingsDto> {
    const userId = req.user.userId;
    let settings = await this.prisma.notificationSettings.findUnique({ where: { userId } });
    if (!settings) {
      // 기본값 생성
      settings = await this.prisma.notificationSettings.create({
        data: {
          userId,
          reminderEnabled: true,
          reminderTime: '09:00',
          friendRequestNotification: true,
          commentNotification: true,
          reactionNotification: true,
          messageNotification: true,
        },
      });
    }
    return {
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.reminderTime ?? '',
      friendRequestNotification: settings.friendRequestNotification,
      commentNotification: settings.commentNotification,
      reactionNotification: settings.reactionNotification,
      messageNotification: settings.messageNotification,
    };
  }

  async updateSettings(req: any, dto: UpdateNotificationSettingsDto): Promise<{ success: boolean; settings: NotificationSettingsDto }> {
    const userId = req.user.userId;
    const settings = await this.prisma.notificationSettings.upsert({
      where: { userId },
      update: { ...dto },
      create: {
        userId,
        reminderEnabled: dto.reminderEnabled ?? true,
        reminderTime: dto.reminderTime ?? '09:00',
        friendRequestNotification: dto.friendRequestNotification ?? true,
        commentNotification: dto.commentNotification ?? true,
        reactionNotification: dto.reactionNotification ?? true,
        messageNotification: dto.messageNotification ?? true,
      },
    });
    return {
      success: true,
      settings: {
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime ?? '',
        friendRequestNotification: settings.friendRequestNotification,
        commentNotification: settings.commentNotification,
        reactionNotification: settings.reactionNotification,
        messageNotification: settings.messageNotification,
      },
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationResponseDto,
  NotificationStatus,
  NotificationType,
  UpdateNotificationDto,
  NotificationPrefsDto,
  DeviceTokenDto,
} from './dto';
import { BaseService } from '../common/logger/base.service';

@Injectable()
export class NotificationService extends BaseService {
  constructor(private prisma: PrismaService) {
    super(NotificationService.name);
  }

  // 알림 생성 (집계 로직 포함)
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const {
      recipientId,
      type,
      actorIds,
      objectType,
      objectId,
      groupKey,
      payload,
    } = dto;

    // 집계 키가 있는 경우 기존 알림 찾기 (15분 윈도우)
    let existingNotification: any = null;
    if (groupKey) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      existingNotification = await this.prisma.notification.findFirst({
        where: {
          recipientId,
          groupKey,
          createdAt: { gte: fifteenMinutesAgo },
        },
      });
    }

    let notification;
    if (existingNotification) {
      // 기존 알림 업데이트 (집계)
      const newActorIds = [
        actorIds[0],
        ...((existingNotification.actorIds as string[]) || []),
      ];
      const uniqueActorIds = [...new Set(newActorIds)]; // 중복 제거

      notification = await this.prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          actorIds: uniqueActorIds,
          groupCount: uniqueActorIds.length,
          payload,
          updatedAt: new Date(),
        },
      });
    } else {
      // 새 알림 생성
      notification = await this.prisma.notification.create({
        data: {
          recipientId,
          type,
          actorIds,
          objectType,
          objectId,
          groupKey,
          groupCount: actorIds.length,
          payload,
          status: NotificationStatus.UNREAD,
        },
      });

      // 읽지 않은 알림 카운터 증가
      await this.incrementUnreadCount(recipientId);
    }

    return this.mapToResponseDto(notification);
  }

  // 알림 목록 조회 (커서 기반 페이지네이션)
  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationResponseDto[]> {
    const { limit = 20, cursor, status, onlyUnread } = query;

    const where: any = {
      recipientId: userId,
    };

    if (cursor) {
      where.id = { lt: cursor };
    }

    if (status) {
      where.status = status;
    } else if (onlyUnread) {
      where.status = NotificationStatus.UNREAD;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        recipient: true,
      },
    });

    return Promise.all(notifications.map((n) => this.mapToResponseDto(n)));
  }

  // 알림 읽음 처리
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    if (notification.status === NotificationStatus.UNREAD) {
      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.READ },
      });

      // 읽지 않은 알림 카운터 감소
      await this.decrementUnreadCount(userId);

      return this.mapToResponseDto(updated);
    }

    return this.mapToResponseDto(notification);
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const unreadNotifications = await this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
      select: { id: true },
    });

    if (unreadNotifications.length > 0) {
      await this.prisma.notification.updateMany({
        where: {
          recipientId: userId,
          status: NotificationStatus.UNREAD,
        },
        data: { status: NotificationStatus.READ },
      });

      // 읽지 않은 알림 카운터 리셋
      await this.resetUnreadCount(userId);
    }

    return { count: unreadNotifications.length };
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId: string): Promise<number> {
    let counter = await this.prisma.notificationCounter.findUnique({
      where: { userId },
    });

    if (!counter) {
      // 카운터가 없으면 생성
      const actualCount = await this.prisma.notification.count({
        where: {
          recipientId: userId,
          status: NotificationStatus.UNREAD,
        },
      });

      counter = await this.prisma.notificationCounter.create({
        data: {
          userId,
          unreadCount: actualCount,
        },
      });
    }

    return counter.unreadCount;
  }

  // 알림 설정 조회
  async getNotificationPrefs(userId: string) {
    let prefs = await this.prisma.notificationPrefs.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // 기본 설정으로 생성
      prefs = await this.prisma.notificationPrefs.create({
        data: { userId },
      });
    }

    return prefs;
  }

  // 알림 설정 업데이트
  async updateNotificationPrefs(userId: string, dto: NotificationPrefsDto) {
    return this.prisma.notificationPrefs.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  // 디바이스 토큰 등록
  async registerDeviceToken(userId: string, dto: DeviceTokenDto) {
    return this.prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token: dto.token,
        },
      },
      update: {
        platform: dto.platform,
        locale: dto.locale,
        isActive: true,
        lastSeen: new Date(),
      },
      create: {
        userId,
        ...dto,
      },
    });
  }

  // 알림 삭제 (숨김 처리)
  async hideNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.HIDDEN },
    });

    // 읽지 않은 상태였다면 카운터 감소
    if (notification.status === NotificationStatus.UNREAD) {
      await this.decrementUnreadCount(userId);
    }
  }

  // 헬퍼 메서드들
  private async incrementUnreadCount(userId: string): Promise<void> {
    await this.prisma.notificationCounter.upsert({
      where: { userId },
      update: {
        unreadCount: { increment: 1 },
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        unreadCount: 1,
      },
    });
  }

  private async decrementUnreadCount(userId: string): Promise<void> {
    await this.prisma.notificationCounter.upsert({
      where: { userId },
      update: {
        unreadCount: { decrement: 1 },
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        unreadCount: 0,
      },
    });

    // 음수 방지
    await this.prisma.notificationCounter.updateMany({
      where: {
        userId,
        unreadCount: { lt: 0 },
      },
      data: { unreadCount: 0 },
    });
  }

  private async resetUnreadCount(userId: string): Promise<void> {
    await this.prisma.notificationCounter.upsert({
      where: { userId },
      update: {
        unreadCount: 0,
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        unreadCount: 0,
      },
    });
  }

  private async mapToResponseDto(
    notification: any,
  ): Promise<NotificationResponseDto> {
    // 액터 정보 조회
    const actors = await this.prisma.user.findMany({
      where: {
        id: { in: notification.actorIds as string[] },
      },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
      },
    });

    return {
      id: notification.id,
      type: notification.type,
      actorIds: notification.actorIds,
      objectType: notification.objectType,
      objectId: notification.objectId,
      groupKey: notification.groupKey,
      groupCount: notification.groupCount,
      payload: notification.payload,
      status: notification.status,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      expiresAt: notification.expiresAt,
      actors,
      ...this.generateNotificationText(notification, actors),
    };
  }

  private generateNotificationText(
    notification: any,
    actors: any[],
  ): { title: string; body?: string; deepLink?: string } {
    const primaryActor = actors[0];
    const actorName = primaryActor?.username || '알 수 없는 사용자';
    const extraCount = notification.groupCount - 1;

    switch (notification.type) {
      case NotificationType.FOLLOW_REQUESTED:
        return {
          title: `${actorName}님이 회원님을 팔로우하기 요청했어요`,
          deepLink: `/profile/${primaryActor?.username}`,
        };

      case NotificationType.FOLLOWED_YOU:
        return {
          title:
            extraCount > 0
              ? `${actorName}님 외 ${extraCount}명이 회원님을 팔로우했어요`
              : `${actorName}님이 회원님을 팔로우했어요`,
          deepLink: `/profile/${primaryActor?.username}`,
        };

      case NotificationType.JOURNAL_LIKED:
        return {
          title:
            extraCount > 0
              ? `${actorName}님 외 ${extraCount}명이 회원님의 일기를 좋아합니다`
              : `${actorName}님이 회원님의 일기를 좋아합니다`,
          deepLink: `/diary/${notification.objectId}`,
        };

      case NotificationType.JOURNAL_COMMENTED:
        return {
          title:
            extraCount > 0
              ? `${actorName}님 외 ${extraCount}명이 회원님의 일기에 댓글을 남겼습니다`
              : `${actorName}님이 회원님의 일기에 댓글을 남겼습니다`,
          deepLink: `/diary/${notification.objectId}`,
        };

      case NotificationType.DIARY_PUBLISHED:
        return {
          title: `${actorName}님이 새로운 일기를 작성했어요`,
          deepLink: `/diary/${notification.objectId}`,
        };

      case NotificationType.WELLBEING_SEVERE:
        return {
          title: '도움이 필요할 수 있어요',
          body: '최근 지표들이 많이 힘들어 보여요. 가까운 사람과 이야기하거나, 전문 도움을 고려해보세요.',
          deepLink: '/help', // 도움말/리소스 페이지로 연결
        };

      default:
        return {
          title: '새로운 알림이 있습니다',
        };
    }
  }

  // 도메인 이벤트 처리 메서드들
  async handleFollowEvent(
    actorId: string,
    targetId: string,
    type: 'request' | 'accept' | 'direct',
  ): Promise<void> {
    let notificationType: NotificationType;

    switch (type) {
      case 'request':
        notificationType = NotificationType.FOLLOW_REQUESTED;
        break;
      case 'accept':
        notificationType = NotificationType.FOLLOW_APPROVED;
        break;
      case 'direct':
        notificationType = NotificationType.FOLLOWED_YOU;
        break;
    }

    await this.createNotification({
      recipientId: targetId,
      type: notificationType,
      actorIds: [actorId],
      objectType: 'user',
      objectId: actorId,
      groupKey: type === 'direct' ? `followed_you:${targetId}` : undefined,
    });
  }

  async handleJournalEvent(
    actorId: string,
    journalId: string,
    authorId: string,
    type: 'like' | 'comment',
  ): Promise<void> {
    // 자신의 일기에 대한 알림은 제외
    if (actorId === authorId) return;

    const notificationType =
      type === 'like'
        ? NotificationType.JOURNAL_LIKED
        : NotificationType.JOURNAL_COMMENTED;

    await this.createNotification({
      recipientId: authorId,
      type: notificationType,
      actorIds: [actorId],
      objectType: 'journal',
      objectId: journalId,
      groupKey: `${type === 'like' ? 'journal_liked' : 'journal_commented'}:${journalId}`,
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/dto/notification.dto';

@Injectable()
export class StreakBadgeService {
  private readonly logger = new Logger(StreakBadgeService.name);
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationService) {}

  private dayStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  async onDiaryOrCheckin(userId: string, date = new Date()) {
    // 연속일 계산: 어제/오늘 기록 여부
    const today = this.dayStart(date);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const [hasTodayDiary, hasTodayCheckin, hasYesterday] = await Promise.all([
      this.prisma.journal.findFirst({ where: { userId, diaryDate: today }, select: { id: true } }),
      this.prisma.dailyCheckin.findFirst({ where: { userId, diaryDate: today }, select: { id: true } }),
      this.prisma.journal.findFirst({ where: { userId, diaryDate: yesterday }, select: { id: true } })
        .then(r => !!r || this.prisma.dailyCheckin.findFirst({ where: { userId, diaryDate: yesterday }, select: { id: true } }).then(x => !!x)),
    ]);

    const didToday = !!hasTodayDiary || !!hasTodayCheckin;
    if (!didToday) return; // 오늘 기록 없으면 변경 없음

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } });
    if (!user) return;
    const newStreak = hasYesterday ? (user.streakDays + 1) : 1;
    await this.prisma.user.update({ where: { id: userId }, data: { streakDays: newStreak } });
    await this.maybeAwardBadges(userId, newStreak);
  }

  private async maybeAwardBadges(userId: string, streak: number) {
    const thresholds = [3, 7, 30];
    for (const t of thresholds) {
      if (streak === t) {
        const type = `streak_${t}`;
        try {
          await this.prisma.badge.create({ data: { userId, type } });
          // 알림 발송 (뱃지 획득)
          await this.notifications.createNotification({
            recipientId: userId,
            type: NotificationType.DIARY_PUBLISHED as any,
            actorIds: [userId],
            objectType: 'badge',
            objectId: type,
            payload: { badge: type },
            groupKey: `badge_${type}`
          } as any);
        } catch (e) {
          // unique 충돌 시 이미 수여됨
        }
      }
    }
  }
}
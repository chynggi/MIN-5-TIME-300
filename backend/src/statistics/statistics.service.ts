import { Injectable } from '@nestjs/common';
import { DashboardStatisticsDto } from './dto/dashboard.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(req: any, period?: 'week' | 'month' | 'year'): Promise<DashboardStatisticsDto> {
    const userId = req.user.userId;
    // 기간 계산
    const now = new Date();
    let from: Date;
    if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    } else {
      // week
      const day = now.getDay();
      from = new Date(now);
      from.setDate(now.getDate() - day);
    }
    // 일기 데이터 집계
    const diaries = await this.prisma.journal.findMany({
      where: {
        userId,
        createdAt: { gte: from, lte: now },
      },
      orderBy: { createdAt: 'asc' },
    });
    const totalEntries = diaries.length;
    const writingStreak = this.calcStreak(diaries);
    const averageEmotionScore = diaries.length ? diaries.reduce((a, b) => a + (b.emotionScore || 0), 0) / diaries.length : 0;
    const writingDurationAvg = diaries.length ? diaries.reduce((a, b) => a + (b.writingDuration || 0), 0) / diaries.length : 0;
    // 감정 트렌드
    const emotionTrend = diaries.map(d => ({ date: d.createdAt.toISOString().slice(0, 10), score: d.emotionScore }));
    // 가장 많이 쓴 시간대
    const hourCounts: Record<string, number> = {};
    diaries.forEach(d => {
      const hour = d.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '21';
    // consistencyScore, recordScores 등은 별도 테이블 활용
    const recordScores = await this.prisma.recordScore.findMany({ where: { userId } });
    return {
      writingStreak,
      totalEntries,
      averageEmotionScore,
      emotionTrend,
      writingDurationAvg,
      mostActiveTime: `${mostActiveTime}:00`,
      consistencyScore: recordScores.length ? recordScores[0].consistencyScore : 0,
      recordScores: recordScores.map(r => ({
        period: `${r.periodStart.toISOString().slice(0, 10)}~${r.periodEnd.toISOString().slice(0, 10)}`,
        consistencyScore: r.consistencyScore,
        emotionVariance: r.emotionVariance,
        writingQuality: r.writingQuality,
      })),
    };
  }

  private calcStreak(diaries: any[]): number {
    if (!diaries.length) return 0;
    let streak = 1;
    for (let i = diaries.length - 1; i > 0; i--) {
      const prev = diaries[i - 1].createdAt;
      const curr = diaries[i].createdAt;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) streak++;
      else break;
    }
    return streak;
  }
}

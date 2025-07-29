
import { Injectable } from '@nestjs/common';
import { DashboardStatisticsDto } from './dto/dashboard.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * LPG 점수, 등급, 레벨, 하트 진행률 반환
   * 프론트 profile page.tsx 참고
   */
  async getLPGScore(req: any) {
    const userId = req.user.userId;
    // 예시: 일기 수, 감정 점수 등으로 LPG 점수 산출 (실제 로직은 필요에 따라 수정)
    const diaries = await this.prisma.journal.findMany({
      where: { userId },
    });
    const diaryCount = diaries.length;
    const avgEmotion = diaryCount ? diaries.reduce((a, b) => a + (b.emotionScore || 0), 0) / diaryCount : 0;
    // LPG 점수 산정 예시 (0~100)
    const lpgScore = Math.min(100, (diaryCount * 5) + avgEmotion * 10);
    // 등급/레벨 산정 예시
    let grade = 'Bronze I';
    let gradeLevel = 1;
    if (lpgScore >= 90) { grade = 'Diamond'; gradeLevel = 12; }
    else if (lpgScore >= 80) { grade = 'Platinum'; gradeLevel = 10; }
    else if (lpgScore >= 70) { grade = 'Gold III'; gradeLevel = 9; }
    else if (lpgScore >= 60) { grade = 'Gold II'; gradeLevel = 8; }
    else if (lpgScore >= 50) { grade = 'Gold I'; gradeLevel = 7; }
    else if (lpgScore >= 40) { grade = 'Silver III'; gradeLevel = 6; }
    else if (lpgScore >= 30) { grade = 'Silver II'; gradeLevel = 5; }
    else if (lpgScore >= 20) { grade = 'Silver I'; gradeLevel = 4; }
    else if (lpgScore >= 15) { grade = 'Bronze III'; gradeLevel = 3; }
    else if (lpgScore >= 10) { grade = 'Bronze II'; gradeLevel = 2; }
    // 하트 진행률 (0~100)
    const heartProgress = Math.round((lpgScore % 10) * 10);
    return {
      lpgScore: Number(lpgScore.toFixed(1)),
      grade,
      gradeLevel,
      heartProgress,
    };
  }

  async getDashboard(req: any, period?: 'week' | 'month' | 'year'): Promise<DashboardStatisticsDto & { feedbackStats: any }> {
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
    const dashboard = {
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
    // 피드백 품질 통계
    const feedbackCount = await this.prisma.feedbackLog.count({ where: { userId } });
    const recentFeedbacks = await this.prisma.feedbackLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    // 예시: 부적절/차단 피드백(자동 필터 활용)
    const bannedWords = ['욕설', '비속어', '금칙어'];
    const inappropriateCount = await this.prisma.feedbackLog.count({
      where: {
        userId,
        OR: bannedWords.map(word => ({ content: { contains: word } })),
      },
    });
    return {
      ...dashboard,
      feedbackStats: {
        feedbackCount,
        recentFeedbacks,
        inappropriateCount,
      },
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

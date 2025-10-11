
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

  async getDashboard(
    req: any,
    period?: 'recent7' | 'week' | 'month' | 'year',
  ): Promise<DashboardStatisticsDto & { feedbackStats: any }> {
    const userId = req.user.userId;
    const now = new Date();
    let from: Date;
    if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'recent7') {
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - 6);
    } else {
      const day = now.getDay();
      from = new Date(now);
      from.setDate(now.getDate() - day);
    }

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
    const emotionTrend = diaries.map(d => ({ date: d.createdAt.toISOString().slice(0, 10), score: d.emotionScore }));

    const hourCounts: Record<string, number> = {};
    diaries.forEach(d => {
      const hour = d.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '21';

    const [recordScores, rangeCheckins, baseline] = await Promise.all([
      this.prisma.recordScore.findMany({ where: { userId } }),
      this.prisma.dailyCheckin.findMany({
        where: {
          userId,
          diaryDate: { gte: from, lte: now },
        },
        orderBy: { diaryDate: 'asc' },
      }),
      this.prisma.userBaselineCheckin.findUnique({ where: { userId } }),
    ]);

    const mentalTrend = rangeCheckins
      .map(checkin => {
        const score01 = this.computeMentalScore(checkin);
        if (score01 === undefined) return null;
        return {
          date: checkin.diaryDate.toISOString().slice(0, 10),
          score: Math.round(Math.max(0, Math.min(1, score01)) * 100),
        };
      })
      .filter((entry): entry is { date: string; score: number } => !!entry);

    if (!mentalTrend.length && baseline) {
      const baselineScore = this.computeMentalScore(baseline);
      if (baselineScore !== undefined) {
        mentalTrend.push({
          date: now.toISOString().slice(0, 10),
          score: Math.round(Math.max(0, Math.min(1, baselineScore)) * 100),
        });
      }
    }

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
      mentalTrend,
    };

    const feedbackCount = 0;
    const recentFeedbacks: any[] = [];
    const inappropriateCount = 0;

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

  private norm1to10(value?: number | null): number | undefined {
    if (typeof value !== 'number') return undefined;
    return (value - 1) / 9;
  }

  private sleepScore(hours?: number | null, quality?: number | null): number | undefined {
    if (typeof hours !== 'number' || typeof quality !== 'number') return undefined;
    let bucket: number;
    if (hours <= 4) bucket = 0.2;
    else if (hours <= 6) bucket = 0.6;
    else bucket = 1.0;
    const qualityNorm = this.norm1to10(quality) ?? 0;
    return 0.6 * bucket + 0.4 * qualityNorm;
  }

  private computeMentalScore(source: {
    mood_1to10?: number | null;
    stress_1to10?: number | null;
    energy_1to10?: number | null;
    sleep_hours_1to9p?: number | null;
    sleep_quality_1to10?: number | null;
    focus_1to10?: number | null;
    fatigue_1to10?: number | null;
    social_satisfaction_1to10?: number | null;
  } | null): number | undefined {
    if (!source) return undefined;

    const mood = this.norm1to10(source.mood_1to10);
    const stress = this.norm1to10(source.stress_1to10);
    const energy = this.norm1to10(source.energy_1to10);
    const sleep = this.sleepScore(source.sleep_hours_1to9p, source.sleep_quality_1to10);
    const vitality = energy !== undefined && sleep !== undefined ? 0.5 * energy + 0.5 * sleep : energy ?? sleep;
    const focus = this.norm1to10(source.focus_1to10);
    const fatigue = this.norm1to10(source.fatigue_1to10);
    const socialSat = this.norm1to10(source.social_satisfaction_1to10);

    const stressBalance = stress !== undefined ? 1 - stress : undefined;
    const fatigueBalance = fatigue !== undefined ? 1 - fatigue : undefined;

    const parts: Array<[number, number]> = [];
    if (mood !== undefined) parts.push([mood, 0.25]);
    if (stressBalance !== undefined) parts.push([stressBalance, 0.2]);
    if (vitality !== undefined) parts.push([vitality, 0.2]);
    if (focus !== undefined) parts.push([focus, 0.15]);
    if (fatigueBalance !== undefined) parts.push([fatigueBalance, 0.1]);
    if (socialSat !== undefined) parts.push([socialSat, 0.1]);

    if (!parts.length) return undefined;
    const sumWeights = parts.reduce((acc, [, weight]) => acc + weight, 0);
    return parts.reduce((acc, [value, weight]) => acc + value * (weight / sumWeights), 0);
  }
}

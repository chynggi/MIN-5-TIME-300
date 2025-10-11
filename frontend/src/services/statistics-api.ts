import api from '@/lib/api';

export interface LPGScoreResponse {
  lpgScore: number;
  grade: string;
  gradeLevel: number;
  heartProgress: number;
  breakdown: {
    dailyDeduction: number;
    gptBonus: number;
    freeBonus: number;
    communityBonus: number;
    daysSinceJoin: number;
    activities: {
      gptDiaries: number;
      freeDiaries: number;
      locationDiaries: number;
      reactions: number;
      comments: number;
      feedbacks: number;
    };
  };
}

export interface DashboardStatistics {
  writingStreak: number;
  totalEntries: number;
  averageEmotionScore: number;
  emotionTrend: Array<{
    date: string;
    score: number;
  }>;
  mentalTrend?: Array<{
    date: string;
    score: number;
  }>;
  writingDurationAvg: number;
  mostActiveTime: string;
  consistencyScore: number;
  recordScores: Array<{
    period: string;
    consistencyScore: number;
    emotionVariance: number;
    writingQuality: number;
  }>;
}

export const statisticsApi = {
  // LPG 점수 조회
  getLPGScore: (): Promise<LPGScoreResponse> => {
    return api('/statistics/lpg-score');
  },

  // 대시보드 통계 조회
  getDashboardStats: (period?: 'recent7' | 'week' | 'month' | 'year'): Promise<DashboardStatistics> => {
    const params = period ? `?period=${period}` : '';
    return api(`/statistics/dashboard${params}`);
  },
};

export interface EmotionTrendDto {
  date: string;
  score: number;
}

export interface RecordScoreDto {
  period: string;
  consistencyScore: number;
  emotionVariance: number;
  writingQuality: number;
}

export interface DashboardStatisticsDto {
  writingStreak: number;
  totalEntries: number;
  averageEmotionScore: number;
  emotionTrend: EmotionTrendDto[];
  writingDurationAvg: number;
  mostActiveTime: string;
  consistencyScore: number;
  recordScores: RecordScoreDto[];
}

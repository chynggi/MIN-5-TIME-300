export class EmotionTrendDto {
  date: string;
  score: number;
}

export class RecordScoreDto {
  period: string;
  consistencyScore: number;
  emotionVariance: number;
  writingQuality: number;
}

export class DashboardStatisticsDto {
  writingStreak: number;
  totalEntries: number;
  averageEmotionScore: number;
  emotionTrend: EmotionTrendDto[];
  writingDurationAvg: number;
  mostActiveTime: string;
  consistencyScore: number;
  recordScores: RecordScoreDto[];
  mentalTrend?: EmotionTrendDto[];
}

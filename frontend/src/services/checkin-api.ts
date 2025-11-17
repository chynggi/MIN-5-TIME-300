import apiRequest from '@/lib/api';

export type ActivityType = '운동' | '명상' | '스트레칭' | '산책';
export const ALLOWED_ACTIVITY_TYPES: ActivityType[] = ['운동','명상','스트레칭','산책'];

export type CheckinPayload = {
  diaryDate?: string; // YYYY-MM-DD
  journalId?: string;
  mood_1to10: number;
  energy_1to10: number;
  stress_1to10: number;
  sleep_hours_1to9p: number; // 1~9 (9=9+)
  sleep_quality_1to10: number;
  activity_types: ActivityType[];
  workout_intensity_1to10: number; // 운동 포함시 1~10, 아니면 0
  focus_1to10: number;
  fatigue_1to10: number;
  social_count_1to10: number;
  social_satisfaction_1to10: number;
};

export const checkinApi = {
  getToday: (date?: string): Promise<{ exists: boolean; percent: number; checkin?: any }> => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiRequest(`/checkin/today${query}`);
  },
  create: (data: CheckinPayload): Promise<{ id: string; percent: number; diaryDate: string }> => {
    return apiRequest('/checkin', { method: 'POST', body: JSON.stringify(data) });
  },
};

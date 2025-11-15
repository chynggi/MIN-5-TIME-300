import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayUnique,
} from 'class-validator';

// 허용 활동 종류
export const ALLOWED_ACTIVITY_TYPES = [
  '운동',
  '명상',
  '스트레칭',
  '산책',
] as const;

export class CreateCheckinDto {
  @IsOptional()
  @IsString()
  journalId?: string;

  // YYYY-MM-DD 또는 ISO 문자열, 없는 경우 오늘(서버 로컬)을 사용
  @IsOptional()
  @IsDateString()
  diaryDate?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  mood_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  energy_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  stress_1to10!: number;

  // 1~9 (9=9+)
  @IsInt()
  @Min(1)
  @Max(9)
  sleep_hours_1to9p!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  sleep_quality_1to10!: number;

  @IsArray()
  @ArrayUnique()
  @IsIn([...ALLOWED_ACTIVITY_TYPES], { each: true })
  activity_types!: string[];

  // 운동 포함 시 1~10, 아니면 0 허용
  @IsInt()
  @Min(0)
  @Max(10)
  workout_intensity_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  focus_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  fatigue_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  social_count_1to10!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  social_satisfaction_1to10!: number;
}

export type GaugePercentResult = {
  percent: number; // 0..100
  missingKeys: string[];
};

export function normalizeToStartOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function computeGaugePercent(
  payload: CreateCheckinDto,
): GaugePercentResult {
  const requiredKeys = [
    'mood_1to10',
    'energy_1to10',
    'stress_1to10',
    'sleep_hours_1to9p',
    'sleep_quality_1to10',
    'focus_1to10',
    'fatigue_1to10',
    'social_count_1to10',
    'social_satisfaction_1to10',
    'activity_types',
  ] as const;
  const missing: string[] = [];
  for (const k of requiredKeys) {
    const v: any = (payload as any)[k];
    if (k === 'activity_types') {
      if (!Array.isArray(v)) missing.push(k as string);
    } else if (v === undefined || v === null || Number.isNaN(v)) {
      missing.push(k as string);
    }
  }
  let denom = requiredKeys.length;
  let filled = denom - missing.length;
  const needsWorkoutIntensity = payload.activity_types?.includes('운동');
  if (needsWorkoutIntensity) {
    denom += 1;
    if (payload.workout_intensity_1to10 && payload.workout_intensity_1to10 > 0)
      filled += 1;
    else missing.push('workout_intensity_1to10');
  }
  const percent = Math.round((filled / denom) * 100);
  return { percent, missingKeys: missing };
}

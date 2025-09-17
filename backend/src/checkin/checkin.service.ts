import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StreakBadgeService } from '../activity/streak-badge.service';
import { CreateCheckinDto, computeGaugePercent, normalizeToStartOfDay } from './dto/create-checkin.dto';

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService, private readonly streaks: StreakBadgeService) {}

  async create(userId: string, dto: CreateCheckinDto) {
    // 퍼센트 계산 및 100% 검증
    const { percent, missingKeys } = computeGaugePercent(dto);
    if (percent < 100) {
      throw new BadRequestException(`체크인이 완료되지 않았습니다. 누락 항목: ${missingKeys.join(', ')}`);
    }

    // 운동 포함 시 강도 필수 규칙(서버 재검증)
    const needsIntensity = dto.activity_types?.includes('운동');
    if (needsIntensity && (!dto.workout_intensity_1to10 || dto.workout_intensity_1to10 < 1)) {
      throw new BadRequestException('운동을 선택하면 강도(1~10)를 반드시 입력해야 합니다.');
    }

    const diaryDate = dto.diaryDate ? new Date(dto.diaryDate) : new Date();
    const dayStart = normalizeToStartOfDay(diaryDate);

    // journalId 혹은 diaryDate 기준으로 upsert 유사 처리 (unique 제약 충족)
    // 우선 동일 날짜 기존 레코드 조회
    const existing = await this.prisma.dailyCheckin.findFirst({
      where: { userId, diaryDate: dayStart },
    });

    if (existing) {
      await this.prisma.dailyCheckin.delete({ where: { id: existing.id } });
    }

    const created = await this.prisma.dailyCheckin.create({
      data: {
        userId,
        journalId: dto.journalId,
        diaryDate: dayStart,
        mood_1to10: dto.mood_1to10,
        energy_1to10: dto.energy_1to10,
        stress_1to10: dto.stress_1to10,
        sleep_hours_1to9p: dto.sleep_hours_1to9p,
        sleep_quality_1to10: dto.sleep_quality_1to10,
        activity_types: dto.activity_types,
        workout_intensity_1to10: dto.workout_intensity_1to10,
        focus_1to10: dto.focus_1to10,
        fatigue_1to10: dto.fatigue_1to10,
        social_count_1to10: dto.social_count_1to10,
        social_satisfaction_1to10: dto.social_satisfaction_1to10,
      },
    });

  // 스트릭 업데이트
  this.streaks.onDiaryOrCheckin(userId, dayStart).catch(() => {});
  return { id: created.id, percent: 100, diaryDate: created.diaryDate.toISOString() };
  }

  async getToday(userId: string) {
    const now = new Date();
    const dayStart = normalizeToStartOfDay(now);
    const row = await this.prisma.dailyCheckin.findFirst({ where: { userId, diaryDate: dayStart } });
    if (!row) return { exists: false, percent: 0 };
    return { exists: true, percent: 100, checkin: row };
  }
}

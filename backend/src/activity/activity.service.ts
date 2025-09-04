import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// 활동지수 비즈니스 규칙 상수
// 요구사항: 가입 기본값을 100%로 설정하면서 상한도 100으로 상향
const MAX_SCORE = 100; // 최고 등급 상한
// 하루 기본 decay -0.3%
const DAILY_DECAY = 0.3; // 퍼센트 포인트
// 행동별 가점
const GAIN_DIARY_WITH_QUESTION = 0.25; // 질문 받고 작성
const GAIN_DIARY_FREE = 0.27; // 자유 작성
const GAIN_LIKE = 0.005; // 커뮤니티 활동 (좋아요)

// 12 등급 구간 계산: 단순 균등 혹은 커스텀 threshold.
// 요구사항: 최고등급은 99.5% (Level 12)
// 여기서는 약간 가속 곡선 형태로 커스텀 threshold 제공 (필요시 조정 가능)
const LEVEL_THRESHOLDS: number[] = [
  0,    // L1 시작
  5,    // L2
  10,   // L3
  17,   // L4
  25,   // L5
  35,   // L6
  47,   // L7
  60,   // L8
  72,   // L9
  82,   // L10
  91,   // L11
  96,   // L12 (99.5는 cap)
];

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  constructor(private readonly prisma: PrismaService, private readonly realtime: RealtimeGateway) {}

  private clampScore(score: number) {
    if (score < 0) return 0;
    if (score > MAX_SCORE) return MAX_SCORE;
    return parseFloat(score.toFixed(3));
  }

  private calcLevel(score: number): number {
    // thresholds 배열에서 score가 속한 마지막 index + 1
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (score >= LEVEL_THRESHOLDS[i]) level = i + 1;
      else break;
    }
    return level; // 1~12
  }

  private async applyDelta(userId: string, delta: number) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { activityScore: true } });
      if (!user) return null;
      const newScoreRaw = (user.activityScore || 0) + delta;
      const newScore = this.clampScore(newScoreRaw);
      const newLevel = this.calcLevel(newScore);
      return tx.user.update({ where: { id: userId }, data: { activityScore: newScore, activityLevel: newLevel } });
    });
    if (updated) {
      this.realtime.emitActivityUpdate({ userId, activityScore: updated.activityScore, activityLevel: updated.activityLevel });
    }
    return updated;
  }

  async addDiaryScore(userId: string, usedQuestion: boolean) {
    const delta = usedQuestion ? GAIN_DIARY_WITH_QUESTION : GAIN_DIARY_FREE;
    await this.applyDelta(userId, delta);
  }

  async addLikeScore(userId: string) {
    await this.applyDelta(userId, GAIN_LIKE);
  }

  // 하루 decay (CRON 등에서 호출 가정). 등록 사용자가 마지막 decay 이후 지난 일수만큼 감점.
  async dailyDecay(userId: string, today = new Date()) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { activityScore: true, lastActivityDecayAt: true } });
      if (!user) return null;
      const last = user.lastActivityDecayAt || userCreatedFallback(today); // fallback
      const days = diffInDays(last, today);
      if (days <= 0) return null;
      const decayAmount = days * DAILY_DECAY; // 퍼센트 포인트 차감
      const newScore = this.clampScore(user.activityScore - decayAmount);
      const newLevel = this.calcLevel(newScore);
      return tx.user.update({ where: { id: userId }, data: { activityScore: newScore, activityLevel: newLevel, lastActivityDecayAt: today } });
    });
    if (updated) {
      this.realtime.emitActivityUpdate({ userId, activityScore: updated.activityScore, activityLevel: updated.activityLevel });
    }
    return updated;
  }

  // 가입 시 초기값 AI 추정 (현재는 간단 heuristic, 추후 LLM 연동 가능)
  // 입력: 선택 정보(bio, interests 등)를 사용해 대략적인 초기 활동 성향 점수 산출
  async assignInitialScore(userId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { interests: true, lifestyleAnswers: true } });
      if (!user) return null;
      // 이미 기본값 100%로 설정된 경우 로직 스킵 (재실행 방지)
      if (user.activityScore >= 100) {
        return tx.user.update({ where: { id: userId }, data: { lastActivityDecayAt: new Date() } });
      }
      let score = 0;
      score += (user.interests?.length || 0) * 1.2;
      score += (user.lifestyleAnswers?.length || 0) * 0.8;
      if (user.bio) score += 2;
      if (user.mbti) score += 1.5;
      if (score > 30) score = 30;
      const level = this.calcLevel(score);
      return tx.user.update({ where: { id: userId }, data: { activityScore: score, activityLevel: level, lastActivityDecayAt: new Date() } });
    });
    if (updated) {
      this.realtime.emitActivityUpdate({ userId, activityScore: updated.activityScore, activityLevel: updated.activityLevel });
    }
    return updated;
  }

  /** 모든 사용자 일괄 decay (사용자 수 많을 경우 배치/페이지 처리 필요) */
  async dailyDecayAll() {
    const today = new Date();
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      try { await this.dailyDecay(u.id, today); } catch (e: any) { this.logger.warn(`dailyDecay 실패 user=${u.id} ${e.message}`); }
    }
  }
}

// 유틸
function diffInDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / 86400000);
}
function userCreatedFallback(now: Date) {
  // fallback로 오늘 자정 사용
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

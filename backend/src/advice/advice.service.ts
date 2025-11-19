import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/dto/notification.dto';
import OpenAI from 'openai';
import { z } from 'zod';
import { BaseService } from '../common/logger/base.service';

type RiskFlag = 'none' | 'mild' | 'moderate' | 'severe';
type AdviceCategory = 'recovery' | 'shift' | 'reflect' | 'general';

interface AdviceKeyword {
  token: string;
  type: string;
  count: number;
}

interface AdviceContextSnapshot {
  profile: {
    age?: number | null;
    mbti?: string | null;
    interests: string[];
    lifestyle: {
      sleep_target?: number | null;
    };
  };
  checkin?: {
    mood?: number | null;
    stress?: number | null;
    energy?: number | null;
    sleep_hours?: number | null;
  };
  diary_summary?: string | null;
  keywords: AdviceKeyword[];
  metrics: {
    sleep_hours?: number | null;
    screen_time?: number | null;
    steps?: number | null;
    social_interactions?: number | null;
  };
  baselines: {
    mood?: number | null;
    stress?: number | null;
    energy?: number | null;
    sleep_hours?: number | null;
  };
  streaks: {
    low_sleep_days: number;
    high_stress_days: number;
    low_mood_days: number;
  };
  locale: string;
  yesterdayDiaryDate?: string;
}

interface RiskEvaluation {
  risk_flag: RiskFlag;
  score: number;
  reasons: string[];
  category: AdviceCategory;
}

interface AdviceLLMResponse {
  advice: string;
  tags: string[];
  risk_flag: RiskFlag;
}

const TAG_WHITELIST = new Set([
  '수면',
  '스트레스',
  '운동',
  '호흡',
  '휴식',
  '관계',
  '성과압박',
  '자기연민',
  '루틴',
  '에너지',
  '전환',
  '성찰',
  '산책',
  '음악',
]);

const STOPWORDS = new Set([
  '오늘',
  '어제',
  '정말',
  '조금',
  '그냥',
  '그리고',
  '그래서',
  '하지만',
  '너무',
  '정도',
  '이번',
  '하면서',
  '이번주',
]);

const FALLBACK_LIBRARY: Record<AdviceCategory, string[]> = {
  recovery: [
    '밤이 짧았다면 오늘은 스스로에게 관대하게—가능하면 평소보다 조금 일찍 눕는 걸 목표로 해요.',
    '기운이 달릴 땐 따뜻한 음료 한 잔과 가벼운 스트레칭으로 몸을 깨워주세요.',
    '어깨를 툭 떨구고 숨을 길게 내쉬어 보세요—그것만으로도 몸이 잠깐 리셋돼요.',
  ],
  shift: [
    '비슷한 기분이 이어졌다면 짧은 산책이나 음악 한 곡으로 흐름을 바꿔보는 건 어때요?',
    '해야 할 일 많아도 오늘은 가장 작은 것 하나만 끝내보면 어제와 다른 흐름이 생겨요.',
    '답장을 잠시 미뤄도 괜찮아요—당신의 속도를 존중하는 작은 쉼을 허락해 주세요.',
  ],
  reflect: [
    '어제 마음에 남았던 장면 하나를 떠올리며, 그 감정을 오늘 작은 행동으로 이어가볼까요?',
    '비교 대신 기록—오늘 당신이 고마웠던 한 가지를 짧게 적어보면 마음이 정리돼요.',
    '스스로에게 부드럽게, 오늘 한 가지를 덜어내도 괜찮다는 말을 적어두세요.',
  ],
  general: [
    '작게 시작해도 충분해요—지금 할 수 있는 5분짜리 쉬는 시간을 먼저 확보해봐요.',
    '완벽보다 지속이 힘이 돼요, 오늘은 한 걸음만 옮겨도 충분하다는 걸 기억해 주세요.',
    '호흡을 세 번 길게 내쉬고 어깨를 풀어보세요—생각은 잠시 뒤로 미뤄도 괜찮아요.',
  ],
};

const SYSTEM_PROMPT = `당신은 멘탈 웰빙 코치입니다. 한국어로, 1문장(120자 이내)으로만 답하세요.
- 따뜻하고 단정한 톤. 명령이나 비난, 병명 추측 금지.
- 사용자의 선택권을 열어두는 제안형 문장.
- 이모지는 최대 1개, 문장 끝에만 사용.
- 위험 신호가 감지된 경우에도 공포를 조장하지 말고, 전문 도움을 선택지로 제시.
- 답변은 반드시 JSON으로만 반환: {"advice":"…", "tags":[…], "risk_flag":"none|mild|moderate|severe"}`;

const DEVELOPER_PROMPT = `규칙:
1) 120자 이내 1문장.
2) 금지어: 진단/치료 단정 표현(예: 우울증, 약 필요).
3) 오늘 실천 가능한 작은 행동을 1개만 제안.
4) 사용 정보를 노출하지 말 것(예: "당신은 INFJ이므로" 금지).
5) 태그는 1~3개. 후보: ["수면","스트레스","운동","호흡","휴식","관계","성과압박","자기연민","루틴","에너지","전환","성찰","산책","음악"].
6) 카테고리 우선순위: 회복(Recovery) > 전환(Shift) > 성찰(Reflect).`;

const AdviceResponseSchema = z.object({
  advice: z.string().min(8).max(240),
  tags: z.array(z.string().min(1)).min(1).max(3),
  risk_flag: z.enum(['none', 'mild', 'moderate', 'severe']).default('none'),
});

@Injectable()
export class AdviceService extends BaseService {
  private readonly openai?: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {
    super(AdviceService.name);
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async getLatest(userId: string) {
    const latest = await this.prisma.advice.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) {
      return null;
    }
    return {
      id: latest.id,
      advice: latest.advice,
      tags: latest.tags,
      risk_flag: this.toRiskStr(latest.risk),
      createdAt: latest.createdAt.toISOString(),
    };
  }

  async generate(userId: string) {
    this.logger.log(`generate: start advice generation for userId=${userId}`);
    const context = await this.buildContextSnapshot(userId);
    if (!context) {
      throw new BadRequestException('조언 생성을 위한 데이터가 부족합니다.');
    }

    const riskEval = this.evaluateRisk(context);
    const userPayload = this.buildUserPayload(context, riskEval);
    let llmResult: AdviceLLMResponse | null = null;

    if (!this.openai) {
      this.logger.warn('OpenAI API 키가 설정되지 않았습니다. 페일세이프 문장을 사용합니다.');
    } else {
      llmResult = await this.callLLM(userPayload).catch((err) => {
        this.logger.error(
          `generate: LLM 호출 실패 userId=${userId}: ${err?.message}`,
        );
        return null;
      });
    }

    const finalAdvice = this.composeFinalAdvice(llmResult, riskEval);
    const saved = await this.prisma.advice.create({
      data: {
        userId,
        advice: finalAdvice.advice,
        tags: finalAdvice.tags,
        risk: this.toRiskEnum(finalAdvice.risk_flag),
      },
    });

    if (finalAdvice.risk_flag === 'severe') {
      await this.notifySevereRisk(userId, saved.id).catch((err) => {
        this.logger.warn(
          `generate: severe notification failed userId=${userId} adviceId=${saved.id} err=${err?.message}`,
        );
      });
    }

    return {
      id: saved.id,
      advice: saved.advice,
      tags: saved.tags,
      risk_flag: finalAdvice.risk_flag,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async generateWithCache(userId: string, force = false) {
    this.logger.log(
      `generateWithCache: called userId=${userId} force=${force}`,
    );
    const latest = await this.getLatest(userId);
    const isSpike = await this.detectSpike(userId);
    if (!force && !isSpike && latest) {
      const createdAt = new Date(latest.createdAt);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (createdAt > twentyFourHoursAgo) {
        return { ...latest, cached: true };
      }
    }

    const regenerated = await this.generate(userId);
    return {
      ...regenerated,
      cached: false,
      regenerated_due_to: force
        ? 'force'
        : isSpike
        ? 'spike'
        : 'ttl_expired',
    };
  }

  async feedback(userId: string, adviceId: string, isHelpful: boolean) {
    const advice = await this.prisma.advice.findUnique({ where: { id: adviceId } });
    if (!advice || advice.userId !== userId) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    const up = await this.prisma.adviceFeedback.upsert({
      where: { adviceId_userId: { adviceId, userId } },
      update: { isHelpful },
      create: { adviceId, userId, isHelpful },
    });
    return { id: up.id, adviceId, isHelpful };
  }

  private async buildContextSnapshot(userId: string): Promise<AdviceContextSnapshot | null> {
    const today = new Date();
    const yesterdayStart = this.startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [user, yesterdayJournal, checkins14, recentCheckins] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          birthDate: true,
          mbti: true,
          interests: { select: { interest: true }, orderBy: { priority: 'asc' }, take: 5 },
          lifestyleAnswers: { select: { question: true, answer: true } },
        },
      }),
      this.prisma.journal.findFirst({
        where: { userId, diaryDate: { gte: yesterdayStart, lte: yesterdayEnd } },
        orderBy: { diaryDate: 'desc' },
      }),
      this.prisma.dailyCheckin.findMany({
        where: { userId, diaryDate: { gte: twoWeeksAgo, lte: today } },
        orderBy: { diaryDate: 'desc' },
      }),
      this.prisma.dailyCheckin.findMany({
        where: { userId, diaryDate: { gte: threeDaysAgo, lte: today } },
        orderBy: { diaryDate: 'desc' },
      }),
    ]);

    if (!user) {
      return null;
    }

    const yesterdayCheckin = recentCheckins.find((c) =>
      this.isSameDay(c.diaryDate, yesterdayStart),
    );

    const baselines = this.computeBaselines(checkins14);
    const streaks = this.computeStreaks(recentCheckins);
    const diary_summary = this.buildDiarySummary(yesterdayJournal?.content);

    return {
      profile: {
        age: this.deriveAge(user.birthDate),
        mbti: user.mbti,
        interests: user.interests.map((i) => i.interest).filter(Boolean),
        lifestyle: {
          sleep_target: baselines.sleep_hours ?? 7,
        },
      },
      checkin: yesterdayCheckin
        ? {
            mood: yesterdayCheckin.mood_1to10,
            stress: yesterdayCheckin.stress_1to10,
            energy: yesterdayCheckin.energy_1to10,
            sleep_hours: yesterdayCheckin.sleep_hours_1to9p,
          }
        : undefined,
      diary_summary,
      keywords: this.extractKeywords(yesterdayJournal?.content || ''),
      metrics: {
        sleep_hours: yesterdayCheckin?.sleep_hours_1to9p ?? null,
        screen_time: null,
        steps: null,
        social_interactions: yesterdayCheckin?.social_count_1to10 ?? null,
      },
      baselines,
      streaks,
      locale: 'ko-KR',
      yesterdayDiaryDate: yesterdayJournal?.diaryDate?.toISOString(),
    };
  }

  private evaluateRisk(context: AdviceContextSnapshot): RiskEvaluation {
    const reasons: string[] = [];
    const baselines = context.baselines;
    const yesterday = context.checkin;
    let score = 0;
    const categoryPriority: AdviceCategory[] = ['recovery', 'shift', 'reflect', 'general'];
    let category: AdviceCategory = 'general';

    if (yesterday) {
      if (
        typeof yesterday.sleep_hours === 'number' &&
        typeof baselines.sleep_hours === 'number' &&
        yesterday.sleep_hours <= (baselines.sleep_hours ?? 0) - 1.5
      ) {
        reasons.push('sleep_low');
        score += 1;
        category = 'recovery';
      }
      if (
        typeof yesterday.mood === 'number' &&
        (yesterday.mood <= 4 ||
          (typeof baselines.mood === 'number' &&
            yesterday.mood <= (baselines.mood ?? 0) - 1))
      ) {
        reasons.push('mood_low');
        score += 1;
        category = 'recovery';
      }
      if (
        typeof yesterday.stress === 'number' &&
        (yesterday.stress >= 7 ||
          (typeof baselines.stress === 'number' &&
            yesterday.stress >= (baselines.stress ?? 0) + 2))
      ) {
        reasons.push('stress_high');
        score += 1;
        category = 'recovery';
      }
      if (
        typeof yesterday.energy === 'number' &&
        typeof baselines.energy === 'number' &&
        yesterday.energy <= (baselines.energy ?? 0) - 1
      ) {
        reasons.push('energy_low');
        score += 1;
        category = 'recovery';
      }
    }

    if (
      context.streaks.low_sleep_days >= 3 ||
      context.streaks.high_stress_days >= 3 ||
      context.streaks.low_mood_days >= 3
    ) {
      reasons.push('streak_warning');
      score += 1;
      if (category === 'general') {
        category = 'shift';
      }
    }

    if (category === 'general' && context.streaks.high_stress_days >= 2) {
      category = 'shift';
    }

    if (category === 'general' && context.keywords.length) {
      category = 'reflect';
    }

    const normalizedCategory = categoryPriority.includes(category)
      ? category
      : 'general';

    let risk_flag: RiskFlag = 'none';
    if (score === 1) {
      risk_flag = 'mild';
    } else if (score >= 2 && score <= 3) {
      risk_flag = 'moderate';
    } else if (score >= 4) {
      risk_flag = 'severe';
    }

    return {
      risk_flag,
      score,
      reasons,
      category: normalizedCategory,
    };
  }

  private buildUserPayload(
    context: AdviceContextSnapshot,
    risk: RiskEvaluation,
  ): string {
    return JSON.stringify(
      {
        context: {
          profile: context.profile,
          checkin: context.checkin ?? null,
          diary_summary: context.diary_summary ?? '',
          keywords: context.keywords,
          metrics: context.metrics,
          baselines: context.baselines,
          streaks: context.streaks,
          locale: context.locale,
          category_hint: risk.category,
          risk_reasons: risk.reasons,
        },
        policy: {
          max_chars: 120,
          allow_emoji: true,
          locale: context.locale,
        },
      },
      null,
      2,
    );
  }

  private async callLLM(payload: string): Promise<AdviceLLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    const input = [
      {
        role: 'system',
        content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
      },
      {
        role: 'developer',
        content: [{ type: 'input_text', text: DEVELOPER_PROMPT }],
      },
      { role: 'user', content: [{ type: 'input_text', text: payload }] },
    ];

    const response = await this.openai.responses.create({
      model: 'gpt-5.1',
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'AdviceResponse',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['advice', 'tags', 'risk_flag'],
            properties: {
              advice: {
                type: 'string',
                maxLength: 240,
              },
              tags: {
                type: 'array',
                minItems: 1,
                maxItems: 3,
                items: { type: 'string' },
              },
              risk_flag: {
                type: 'string',
                enum: ['none', 'mild', 'moderate', 'severe'],
              },
            },
          },
        },
        verbosity: 'medium',
      },
      reasoning: {
        effort: 'medium',
      },
      store: false,
    } as any);

    const raw = this.extractResponseText(response);
    const parsed = AdviceResponseSchema.safeParse(this.parseLLMJson(raw));
    if (!parsed.success) {
      throw new Error('LLM 응답 파싱 실패');
    }
    return {
      advice: this.trimSentence(parsed.data.advice),
      tags: this.sanitizeTags(parsed.data.tags),
      risk_flag: parsed.data.risk_flag,
    };
  }

  private composeFinalAdvice(
    llmResult: AdviceLLMResponse | null,
    risk: RiskEvaluation,
  ): AdviceLLMResponse {
    if (llmResult) {
      const normalizedTags = this.sanitizeTags(llmResult.tags);
      const normalizedRisk = llmResult.risk_flag || risk.risk_flag;
      return {
        advice: this.trimSentence(llmResult.advice),
        tags: normalizedTags.length ? normalizedTags : this.defaultTagsFor(risk.category),
        risk_flag: normalizedRisk,
      };
    }

    const fallbackAdvice = this.pickFallbackAdvice(risk.category);
    return {
      advice: fallbackAdvice,
      tags: this.defaultTagsFor(risk.category),
      risk_flag: risk.risk_flag || 'none',
    };
  }

  private async notifySevereRisk(userId: string, adviceId: string) {
    await this.notifications.createNotification({
      recipientId: userId,
      type: NotificationType.WELLBEING_SEVERE,
      actorIds: [userId],
      objectType: 'advice',
      objectId: adviceId,
      payload: { risk: 'SEVERE' } as any,
      groupKey: 'wellbeing_severe',
    } as any);
  }

  private async detectSpike(userId: string): Promise<boolean> {
    const today = this.startOfDay(new Date());
    const start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const checkin = await this.prisma.dailyCheckin.findFirst({
      where: { userId, diaryDate: { gte: start, lt: end } },
    });
    if (!checkin) return false;
    return (
      checkin.stress_1to10 >= 7 ||
      checkin.mood_1to10 <= 3 ||
      checkin.sleep_hours_1to9p <= 4
    );
  }

  private computeBaselines(records: any[]) {
    if (!records.length) {
      return {};
    }
    const avg = (selector: (r: any) => number | null | undefined) => {
      const values = records
        .map((r) => selector(r))
        .filter((v): v is number => typeof v === 'number');
      if (!values.length) return null;
      return Number(
        (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1),
      );
    };
    return {
      mood: avg((r) => r.mood_1to10),
      stress: avg((r) => r.stress_1to10),
      energy: avg((r) => r.energy_1to10),
      sleep_hours: avg((r) => r.sleep_hours_1to9p),
    };
  }

  private computeStreaks(records: any[]) {
    const sorted = [...records].sort(
      (a, b) => new Date(b.diaryDate).getTime() - new Date(a.diaryDate).getTime(),
    );
    const calcStreak = (predicate: (record: any) => boolean) => {
      let streak = 0;
      let lastDate: Date | null = null;
      for (const record of sorted) {
        const currentDate = this.startOfDay(new Date(record.diaryDate));
        if (lastDate && lastDate.getTime() - currentDate.getTime() > 24 * 60 * 60 * 1000) {
          break;
        }
        if (!predicate(record)) {
          break;
        }
        streak += 1;
        lastDate = currentDate;
      }
      return streak;
    };

    return {
      low_sleep_days: calcStreak((r) => r.sleep_hours_1to9p <= 5),
      high_stress_days: calcStreak((r) => r.stress_1to10 >= 7),
      low_mood_days: calcStreak((r) => r.mood_1to10 <= 4),
    };
  }

  private extractKeywords(text: string, limit = 3): AdviceKeyword[] {
    if (!text) return [];
    const tokens = text
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
    const counts = new Map<string, number>();
    tokens.forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([token, count]) => ({ token, type: 'event', count }));
  }

  private buildDiarySummary(content?: string | null): string | null {
    if (!content) return null;
    const masked = this.maskPII(content).replace(/\s+/g, ' ').trim();
    if (!masked) return null;
    return masked.length > 200 ? masked.slice(0, 200) : masked;
  }

  private sanitizeTags(tags: string[] = []): string[] {
    const unique = Array.from(new Set(tags.map((t) => t.trim())));
    const filtered = unique.filter((tag) => TAG_WHITELIST.has(tag));
    return filtered.slice(0, 3);
  }

  private defaultTagsFor(category: AdviceCategory): string[] {
    switch (category) {
      case 'recovery':
        return ['휴식', '루틴'];
      case 'shift':
        return ['전환', '루틴'];
      case 'reflect':
        return ['성찰'];
      default:
        return ['루틴'];
    }
  }

  private pickFallbackAdvice(category: AdviceCategory): string {
    const library = FALLBACK_LIBRARY[category] || FALLBACK_LIBRARY.general;
    return library[Math.floor(Math.random() * library.length)];
  }

  private trimSentence(sentence: string): string {
    const trimmed = sentence.trim();
    return trimmed.length > 120 ? `${trimmed.slice(0, 119)}…` : trimmed;
  }

  private maskPII(text: string): string {
    return (text || '')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[이메일]')
      .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[연락처]')
      .replace(/\b\d{10,11}\b/g, '[연락처]');
  }

  private deriveAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const diff = Date.now() - date.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isSameDay(a: Date, b: Date) {
    const dateA = new Date(a);
    return (
      dateA.getFullYear() === b.getFullYear() &&
      dateA.getMonth() === b.getMonth() &&
      dateA.getDate() === b.getDate()
    );
  }

  private extractResponseText(resp: any): string {
    if (!resp) throw new Error('빈 응답입니다');
    if (resp.output_text) {
      if (Array.isArray(resp.output_text) && resp.output_text.length) {
        return resp.output_text.join('\n');
      }
      if (typeof resp.output_text === 'string' && resp.output_text.trim().length) {
        return resp.output_text;
      }
    }
    if (Array.isArray(resp.output)) {
      const text = resp.output
        .map((item: any) =>
          (item?.content || [])
            .map((c: any) => c?.text)
            .filter(Boolean)
            .join('\n'),
        )
        .filter(Boolean)
        .join('\n');
      if (text) return text;
    }
    throw new Error('LLM 응답을 찾을 수 없습니다.');
  }

  private parseLLMJson(raw: string) {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  }

  private toRiskEnum(r: RiskFlag) {
    switch (r) {
      case 'mild':
        return 'MILD';
      case 'moderate':
        return 'MODERATE';
      case 'severe':
        return 'SEVERE';
      default:
        return 'NONE';
    }
  }

  private toRiskStr(r: any): RiskFlag {
    const value = String(r || '').toUpperCase();
    if (value === 'MILD') return 'mild';
    if (value === 'MODERATE') return 'moderate';
    if (value === 'SEVERE') return 'severe';
    return 'none';
  }
}
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/dto/notification.dto';

type RiskFlag = 'none' | 'mild' | 'moderate' | 'severe';

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

@Injectable()
export class AdviceService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationService) {}

  async getLatest(userId: string) {
    const latest = await this.prisma.advice.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!latest) return null;
    return { id: latest.id, advice: latest.advice, tags: latest.tags as string[], risk_flag: this.toRiskStr(latest.risk) };
  }

  async generate(userId: string) {
    // 1) 컨텍스트 수집: 최근 일기 요약(간단), 어제/최근 14일 체크인, 베이스라인
    const today = new Date();
    const end = new Date(today);
    const start14 = new Date(today); start14.setDate(start14.getDate() - 14);
    const start3 = new Date(today); start3.setDate(start3.getDate() - 3);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const yStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const [lastDiary, recentDiaries, checkins14, checkins3, baseline] = await Promise.all([
      this.prisma.journal.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.journal.findMany({ where: { userId, createdAt: { gte: start3, lte: end } }, orderBy: { createdAt: 'desc' }, take: 3 }),
      this.prisma.dailyCheckin.findMany({ where: { userId, diaryDate: { gte: start14, lte: end } } }),
      this.prisma.dailyCheckin.findMany({ where: { userId, diaryDate: { gte: start3, lte: end } } }),
      this.prisma.userBaselineCheckin.findUnique({ where: { userId } }),
    ]);

    const yesterdayCheckin = await this.prisma.dailyCheckin.findFirst({ where: { userId, diaryDate: yStart } });

    const diarySummary = this.summarizeDiaries(recentDiaries);
  const signals = this.evalSignals(yesterdayCheckin, checkins14, checkins3, baseline);
  const risk = this.computeRisk(signals, checkins14);

    const { advice, tags } = this.composeAdvice(diarySummary, signals, risk);

    // 저장 및 반환
    const saved = await this.prisma.advice.create({ data: { userId, advice, tags, risk: this.toRiskEnum(risk) } });
    if (risk === 'severe') {
      // 심각 위험 알림(인앱)
      try {
        await this.notifications.createNotification({
          recipientId: userId,
          type: NotificationType.WELLBEING_SEVERE,
          actorIds: [userId],
          objectType: 'advice',
          objectId: saved.id,
          payload: { risk: 'SEVERE' } as any,
          groupKey: 'wellbeing_severe'
        } as any);
      } catch {}
    }
    return { id: saved.id, advice, tags, risk_flag: risk };
  }

  // 24h TTL 캐시: 최근 생성본이 24시간 내면 반환, 단 force=true거나 스파이크면 재생성
  async generateWithCache(userId: string, force = false) {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const latest = await this.prisma.advice.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!force && latest && latest.createdAt > since) {
      return { id: latest.id, advice: latest.advice, tags: latest.tags as string[], risk_flag: this.toRiskStr(latest.risk), cached: true };
    }
    // 스파이크 감지: 어제 대비 스트레스>=8이거나 mood<=3 등 단순 규칙
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const yStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const y = await this.prisma.dailyCheckin.findFirst({ where: { userId, diaryDate: yStart } });
    const spike = y ? (y.stress_1to10 >= 8 || y.mood_1to10 <= 3) : false;
    const result = await this.generate(userId);
    return { ...result, cached: false, regenerated_due_to: force ? 'force' : (spike ? 'spike' : 'ttl_expired') };
  }

  async feedback(userId: string, adviceId: string, isHelpful: boolean) {
    // 조인 검증: 해당 advice가 본인 소유인지 확인
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

  private summarizeDiaries(diaries: any[]): string {
    if (!diaries || !diaries.length) return '';
    // 150~200자 요약 간소화: 최근 1~2개 문장 취합 후 트림
    const raw = diaries.map(d => (d.content || '').replace(/\s+/g, ' ').trim()).join(' ');
    const masked = this.maskPII(raw);
    return masked.slice(0, 200);
  }

  private maskPII(text: string): string {
    if (!text) return text;
    return text
      // 이메일/전화 간단 마스킹
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[이메일]')
      .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[연락처]')
      .replace(/\b\d{10,11}\b/g, '[연락처]');
  }

  private evalSignals(y: any | null, ck14: any[], ck3: any[], baseline: any | null) {
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const base = {
      mood: baseline?.mood_1to10 ?? Math.round(avg(ck14.map(c => c.mood_1to10)) || 6),
      stress: baseline?.stress_1to10 ?? Math.round(avg(ck14.map(c => c.stress_1to10)) || 4),
      energy: baseline?.energy_1to10 ?? Math.round(avg(ck14.map(c => c.energy_1to10)) || 6),
      sleep_hours: baseline?.sleep_hours_1to9p ?? Math.round(avg(ck14.map(c => c.sleep_hours_1to9p)) || 7),
    };
    const yv = y || {};
    const sleepLow = y ? (yv.sleep_hours_1to9p <= base.sleep_hours - 1.5) : false;
    const moodLow = y ? (yv.mood_1to10 <= 4 || yv.mood_1to10 <= base.mood - 1) : false;
    const stressHigh = y ? (yv.stress_1to10 >= 7 || yv.stress_1to10 >= base.stress + 2) : false;
    const energyLow = y ? (yv.energy_1to10 <= base.energy - 1) : false;

    // 최근 3일 중 부정 신호 반복
    const negDays = ck3.filter(c => c.stress_1to10 >= 7 || c.mood_1to10 <= 4).length;
    const repeatedNegative = negDays >= 2;

    return { base, yesterday: yv, sleepLow, moodLow, stressHigh, energyLow, repeatedNegative };
  }

  private computeRisk(signals: ReturnType<AdviceService['evalSignals']>, ck14: any[]): RiskFlag {
    // z-score 기반: 14일 분포 대비 어제의 편차를 표준화
    const vals = {
      mood: ck14.map(c => c.mood_1to10).filter((v: any) => typeof v === 'number'),
      stress: ck14.map(c => c.stress_1to10).filter((v: any) => typeof v === 'number'),
      energy: ck14.map(c => c.energy_1to10).filter((v: any) => typeof v === 'number'),
      sleepH: ck14.map(c => c.sleep_hours_1to9p).filter((v: any) => typeof v === 'number'),
      sleepQ: ck14.map(c => c.sleep_quality_1to10).filter((v: any) => typeof v === 'number'),
    } as any;
    const stat = (arr: number[]) => {
      if (!arr.length) return { mean: NaN, std: NaN };
      const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
      const v = arr.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(arr.length||1);
      const std = Math.sqrt(v || 1e-6);
      return { mean, std };
    };
    const S = {
      mood: stat(vals.mood),
      stress: stat(vals.stress),
      energy: stat(vals.energy),
      sleepH: stat(vals.sleepH),
      sleepQ: stat(vals.sleepQ),
    };
    const y = signals.yesterday || {} as any;
    const z = (x: number|undefined, m: number, s: number) =>
      typeof x === 'number' && isFinite(m) && isFinite(s) && s>0 ? (x - m) / s : 0;

    const zMood = z(y.mood_1to10, S.mood.mean, S.mood.std); // 낮을수록 위험
    const zStress = z(y.stress_1to10, S.stress.mean, S.stress.std); // 높을수록 위험
    const zEnergy = z(y.energy_1to10, S.energy.mean, S.energy.std); // 낮을수록 위험
    const zSleepH = z(y.sleep_hours_1to9p, S.sleepH.mean, S.sleepH.std); // 낮을수록 위험
    const zSleepQ = z(y.sleep_quality_1to10, S.sleepQ.mean, S.sleepQ.std); // 낮을수록 위험

    // 가중 점수: 표준화된 편차를 방향에 맞게 합산
    // 기준: |z| 0.5 미만은 소음, 0.5~1.0 주의, 1.0~2.0 경고, ≥2.0 심각
    let score = 0;
    if (zStress >= 0.5) score += zStress; // 스트레스는 양의 z만 위험
    if (zMood <= -0.5) score += Math.abs(zMood);
    if (zEnergy <= -0.5) score += Math.abs(zEnergy) * 0.7;
    if (zSleepH <= -0.5) score += Math.abs(zSleepH) * 0.6;
    if (zSleepQ <= -0.5) score += Math.abs(zSleepQ) * 0.6;
    if (signals.repeatedNegative) score += 0.8; // 반복된 부정 신호 가산

    // 단계화: 누적 위험 점수로 레벨 판정
    if (score < 1.0) return 'mild';
    if (score < 2.0) return 'moderate';
    return 'severe';
  }

  private composeAdvice(summary: string, s: ReturnType<AdviceService['evalSignals']>, risk: RiskFlag): { advice: string; tags: string[] } {
    const signal = this.buildSignalMessage(s);
    const lead = this.buildSummaryLead(summary);
    const tags = new Set(signal.tags);

    let sentence = signal.text;
    if (lead) {
      sentence = `${lead.lead} ${signal.text}`.trim();
      lead.tags.forEach(tag => tags.add(tag));
      tags.add('개인화');
    }

    if (risk === 'severe') {
      sentence = this.appendSevereNotice(sentence);
      tags.add('지원');
    }

    sentence = this.clipSentence(sentence);
    return { advice: sentence, tags: Array.from(tags) };
  }

  private buildSignalMessage(s: ReturnType<AdviceService['evalSignals']>): { text: string; tags: string[] } {
    if (s.sleepLow) {
      return { text: '어제 잠이 짧았다면 오늘은 평소보다 조금 일찍 눕는 걸 목표로 해봐요—몸이 고마워할 거예요.', tags: ['수면','휴식','루틴'] };
    }
    if (s.stressHigh) {
      return { text: '어제 긴장이 컸다면 3분만 호흡에 집중해요—생각은 잠시 쉬어도 괜찮아요.', tags: ['스트레스','호흡','휴식'] };
    }
    if (s.energyLow) {
      return { text: '기운이 달렸다면 따뜻한 음료와 5분 스트레칭으로 부드럽게 시작해봐요.', tags: ['에너지','스트레칭','루틴'] };
    }
    if (s.repeatedNegative) {
      return { text: '비슷한 기분이 이어졌다면 오늘은 루틴에 작은 변화를—짧은 산책이나 음악 한 곡 어떨까요?', tags: ['전환','산책','음악'] };
    }
    return { text: '어제 마음에 남은 장면 하나만 떠올려 봐요—그중 하나를 오늘 작은 행동으로 이어가볼까요?', tags: ['성찰','루틴'] };
  }

  private buildSummaryLead(summary: string): { lead: string; tags: string[] } | null {
    const snippet = this.pickSummarySnippet(summary);
    if (!snippet) return null;

    const patterns: Array<{ regex: RegExp; lead: string; tags: string[] }> = [
      { regex: /(불안|걱정|긴장|압박|초조)/i, lead: `"${snippet}" 때문에 마음이 조여 있다면`, tags: ['정서','스트레스'] },
      { regex: /(피곤|지침|무기력|번아웃|휴식)/i, lead: `"${snippet}"처럼 몸이 느려졌다면`, tags: ['휴식','회복'] },
      { regex: /(감사|고마움|행복|설렘|뿌듯|기쁨)/i, lead: `"${snippet}" 순간이 고마웠다면`, tags: ['감사','긍정'] },
      { regex: /(친구|가족|사람|대화|만남|관계)/i, lead: `"${snippet}"에 담긴 관계를 떠올린다면`, tags: ['관계','연결'] },
      { regex: /(도전|시도|성장|배움|계획|목표)/i, lead: `"${snippet}" 계획을 마음에 새겼다면`, tags: ['성장','계획'] },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(summary)) {
        return { lead: pattern.lead, tags: pattern.tags };
      }
    }

    return { lead: `"${snippet}" 마음이 남아 있다면`, tags: ['성찰'] };
  }

  private pickSummarySnippet(summary: string, max = 28): string | null {
    if (!summary) return null;
    const compact = summary.replace(/\s+/g, ' ').trim();
    if (!compact) return null;
    if (compact.length <= max) return compact;
    return `${compact.slice(0, max - 1)}…`;
  }

  private appendSevereNotice(sentence: string): string {
    const trimmed = sentence.replace(/\.$/, '');
    return `${trimmed} 도움이 급하면 가까운 사람이나 전문기관과 연결해도 괜찮아요.`;
  }

  private clipSentence(sentence: string): string {
    return sentence.length > 120 ? `${sentence.slice(0, 119)}…` : sentence;
  }

  private toRiskEnum(r: RiskFlag) {
    switch (r) {
      case 'mild': return 'MILD';
      case 'moderate': return 'MODERATE';
      case 'severe': return 'SEVERE';
      default: return 'NONE';
    }
  }
  private toRiskStr(r: any): RiskFlag {
    const m = String(r || '').toUpperCase();
    if (m === 'MILD') return 'mild';
    if (m === 'MODERATE') return 'moderate';
    if (m === 'SEVERE') return 'severe';
    return 'none';
  }
}

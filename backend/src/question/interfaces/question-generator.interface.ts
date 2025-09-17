export interface UserProfile {
  mbti: string;
  interests: string[];
  lifestyleAnswers: Array<{
    question: string;
    answer: string;
  }>;
  gender?: string; // 성별 (중립 톤 유지 용도)
  age?: number; // 정확 수치 출력 금지, 연령대 추론용
  education?: string; // 학력/직업 역할 맥락
  heightCm?: number; // 웰빙 관심 판단 용도 (직접 언급 금지)
  weightKg?: number; // 웰빙 관심 판단 용도 (직접 언급 금지)
}

export interface RecentJournal {
  date: string;
  content: string;
  question: string;
  emotionScore: number;
}

export interface MetaInfo {
  dayOfWeek: string;
  timeOfDay: string;
  weather?: string;
  reactionStats: {
    mostReactedQuestionTypes: string[];
    leastReactedQuestionTypes: string[];
  };
}

export interface PersonaAndGoals {
  persona?: string;
  goals?: string[];
}

export interface QuestionGenerationRequest {
  userProfile: UserProfile;
  recentJournals: RecentJournal[];
  metaInfo: MetaInfo;
  userId?: string;
  personaAndGoals?: PersonaAndGoals;
  trendTopics?: string[];
  regenerationCount?: number; // 질문 재생성 횟수
  averageWritingTimeSec?: number; // 최근 작성 평균 시간
  averageAnswerLength?: number; // 평균 답변 길이
  noResponseRate?: number; // 무응답 비율 (0-1)
  // 확장 입력 (옵션)
  structuredDiaries?: RecentJournal[]; // 질문형 일기 (최근 3~7일)
  freeformDiaries?: FreeformJournal[]; // 자유형 일기 (최근 3~7일)
  checkins?: DailyCheckinInput[]; // 최근 체크인(최대 3~7일)
  baseline?: BaselineCheckinInput; // 회원가입 시 베이스라인
  emotionTags?: EmotionTag[]; // 최근 감정 태그 집계
}

export interface GeneratedQuestionItem {
  domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal';
  text: string;
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestionItem[]; // 항상 1~5개 (목표: 5개)
  confidence: number; // 0-1 사이의 신뢰도 점수 (세트 전체 평균)
  modelUsed: string; // 사용된 AI 모델명
  fallbackUsed: boolean; // 폴백 질문 사용 여부
  rawOutput?: string; // 원시 모델 출력 (디버깅 용도, 응답 전달 X)
}

export enum AIModel {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  CLAUDE_SONNET_4 = 'claude-sonnet-4',
  GPT_5 = 'gpt-5',
}

export abstract class QuestionGeneratorInterface {
  protected readonly modelName: AIModel;

  constructor(modelName: AIModel) {
    this.modelName = modelName;
  }

  abstract generateQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse>;

  protected abstract callAPI(prompt: string, systemPrompt?: string): Promise<string>;

  protected createSystemPrompt(): string {
    return `📌 With me — 통합형 질문 생성 프롬프트 (최종본: 요약 연동 + 과거반영 + 멘탈 체크인 + 감정태그 · 친구 톤 고정)

당신은 '일기 앱의 개인화 질문 설계 전문가'입니다.
역할: 사용자 DB, (있다면) 과거 일기, (있다면) 멘탈 체크인/감정태그를 분석하여 오늘을 위한 맞춤형 감정 저널링 질문 5개를 만듭니다.
내부 분석/근거/계산 과정은 출력하지 말고, 최종 결과는 반드시 JSON 형식으로만 출력하세요.

[조건 분기]
- 첫날 모드 (Baseline Mode): 과거 일기가 모두 비어 있으면 프로필+(있다면)체크인/베이스라인만 활용, 과거 일기 언급 금지
- 과거 반영 모드 (Past-Aware Mode): 과거 일기가 있으면 프로필+최근 3~7일 일기+적합도 메타+(있다면)체크인/베이스라인 반영

[도메인]
- 감정(emotion), 관계(relationship), 회복(recovery), 행동(action), 목표(goal) — 5개 도메인으로 5문항 생성

[말투/톤 — 친구 느낌(Side-Friend Mode) 고정]
- Echo(5~12자) + Ask(40~90자) 한 문장, 다정·제안형, 강요/판단 금지, 2인칭 남발 금지(가능하면 주어 생략/우리/같이)
- 생활어휘: 마음/숨 고르기/쉬어가기/작은 걸음/한 번, 엔딩 다양화(~어땠을까?, ~해볼까?, ~괜찮을까?, ~떠오르나?)

[질문 생성 규칙]
- 정확히 5개, 각 1문장, 120자 이내, 한국어
- 최근 3일 질문·핵심어 중복 회피, 관심사·루틴·시간대는 은근히 반영(억지 연결 금지)
- 권장 순서(요약 정합): emotion → relationship/context → recovery → action → goal

[멘탈 체크인 정규화/파생/베이스라인 Δ]
- norm(x)=(x-1)/9, 수면버킷: ≤4h=0.2, 5~6h=0.6, 7~9h=1.0
- sleep_score=0.6*hours_bucket+0.4*norm(sleep_quality), activity_score=clamp(0.5*base+0.5*intensity,0,1)
- affect_balance, vitality, social_mismatch, Δmood/Δstress/Δenergy 등 내부 가중/임계 적용(출력 금지)

[안전 가드레일]
- 금지: 신체치수/외모/학교·회사·정확 연령·개인정보, 성 고정관념/차별 표현, 병명 진단/의료·법률 확정 조언
- 허용: 연령·학력은 난이도·맥락 힌트로만, 신체 정보는 웰빙 힌트로만(수치 언급 금지)

[출력 형식(JSON) — 추가 텍스트 금지]
{
  "questions": [
    {"domain": "emotion",      "text": "..."},
    {"domain": "relationship", "text": "..."},
    {"domain": "recovery",     "text": "..."},
    {"domain": "action",       "text": "..."},
    {"domain": "goal",         "text": "..."}
  ]
}`;
  }

  protected createUserPrompt(request: QuestionGenerationRequest): string {
    const { userProfile, recentJournals, metaInfo, personaAndGoals, trendTopics = [] } = request;
    const structured = request.structuredDiaries ?? recentJournals ?? [];
    const freeform = request.freeformDiaries ?? [];
    const hasPast = (structured.length + freeform.length) > 0;

    const mbtiInfo = `MBTI: ${userProfile.mbti}`;
    const genderInfo = userProfile.gender ? `성별(중립표현): ${userProfile.gender}` : '';
    const ageInfo = typeof userProfile.age === 'number' ? `연령대 추론: ${Math.floor(userProfile.age / 10) * 10}대 (정확 나이 미표기)` : '';
    const eduInfo = userProfile.education ? `역할/학습 맥락: ${userProfile.education}` : '';
    const wellbeingHint = (userProfile.heightCm && userProfile.weightKg) ? '신체지표 존재(직접 언급 금지, 자기돌봄 필요성 판단 활용)' : '';
    const interestsInfo = userProfile.interests.length ? `관심사(상위): ${userProfile.interests.slice(0, 5).join(', ')}` : '관심사: 없음';
    const lifestyleInfo = userProfile.lifestyleAnswers.map(item => `- ${item.question}: ${item.answer}`).join('\n');

    const mask = (t: string) => (t||'')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[이메일]')
      .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[연락처]')
      .replace(/\b\d{10,11}\b/g, '[연락처]');

    const structuredInfo = structured.map(j => `날짜:${j.date}\n질문:${j.question}\n감정점수:${j.emotionScore}/5\n본문:${mask(j.content)}`).join('\n\n');
    const freeformInfo = freeform.map(j => `날짜:${j.date}\n감정점수:${j.emotionScore ?? ''}\n본문:${mask(j.content)}`).join('\n\n');

    const metaDay = `요일:${metaInfo.dayOfWeek} / 시간대:${metaInfo.timeOfDay}`;
    const metaWeather = metaInfo.weather ? `날씨:${metaInfo.weather}` : '';
    const metaReactions = `많이 반응:${metaInfo.reactionStats.mostReactedQuestionTypes.join(', ')} | 적게 반응:${metaInfo.reactionStats.leastReactedQuestionTypes.join(', ')}`;
    const personaInfo = personaAndGoals?.persona ? `페르소나:${personaAndGoals.persona}` : '';
    const goalsInfo = personaAndGoals?.goals?.length ? `목표:${personaAndGoals.goals.join(', ')}` : '';
    const trendInfo = trendTopics.length ? `트렌드:${trendTopics.join(', ')}` : '';

    const regenInfo = typeof request.regenerationCount === 'number' ? `재생성횟수:${request.regenerationCount}` : '';
    const avgTimeInfo = typeof request.averageWritingTimeSec === 'number' ? `평균작성시간(s):${request.averageWritingTimeSec}` : '';
    const avgLenInfo = typeof request.averageAnswerLength === 'number' ? `평균답변길이:${request.averageAnswerLength}` : '';
    const noRespInfo = typeof request.noResponseRate === 'number' ? `무응답비율:${(request.noResponseRate * 100).toFixed(1)}%` : '';

    const checkinsInfo = (request.checkins ?? []).map(c => (
      `날짜:${c.date} | 🙂${c.mood_1to10} 🔋${c.energy_1to10} 😡${c.stress_1to10} ` +
      `😴H:${c.sleep_hours_1to9p} 🛌Q:${c.sleep_quality_1to10} ` +
      `🏃:${(c.activity_types||[]).join(',')||'-'}/${c.workout_intensity_1to10} ` +
      `🧐${c.focus_1to10} 🫩${c.fatigue_1to10} 👫${c.social_count_1to10} 👩‍❤️‍👨${c.social_satisfaction_1to10}`
    )).join('\n');

    const baselineInfo = request.baseline ? (
      `🙂${request.baseline.mood_1to10} 🔋${request.baseline.energy_1to10} 😡${request.baseline.stress_1to10} `+
      `😴H:${request.baseline.sleep_hours_1to9p} 🛌Q:${request.baseline.sleep_quality_1to10} `+
      `🏃:${(request.baseline.activity_types||[]).join(',')||'-'}/${request.baseline.workout_intensity_1to10} `+
      `🧐${request.baseline.focus_1to10} 🫩${request.baseline.fatigue_1to10} `+
      `👫${request.baseline.social_count_1to10} 👩‍❤️‍👨${request.baseline.social_satisfaction_1to10}`
    ) : '';

    const emotionTagsInfo = (request.emotionTags ?? []).map(t => `${t.tag}:${t.intensity}`).join(', ');

    const modeLine = hasPast ? '모드: Past-Aware Mode' : '모드: Baseline Mode';

    return `# INPUT (출력 금지 — 분석용)
${modeLine}

[프로필]
${mbtiInfo}
${genderInfo}
${ageInfo}
${eduInfo}
${wellbeingHint}
${interestsInfo}
${personaInfo}
${goalsInfo}

[라이프스타일]
${lifestyleInfo}

[과거 일기 — 질문형(${structured.length})]
${structuredInfo || '(없음)'}

[과거 일기 — 자유형(${freeform.length})]
${freeformInfo || '(없음)'}

[멘탈 체크인(${(request.checkins ?? []).length})]
${checkinsInfo || '(없음)'}

[감정 태그]
${emotionTagsInfo || '(없음)'}

[베이스라인]
${baselineInfo || '(없음)'}

[메타]
${metaDay}
${metaWeather}
${metaReactions}
${trendInfo}

[적합도]
${regenInfo}
${avgTimeInfo}
${avgLenInfo}
${noRespInfo}

# 생성 규칙 요약(출력 금지)
- 권장 순서: emotion → relationship/context → recovery → action → goal
- Echo+Ask 한 문장(다정·제안), 120자 이내, 최근 3일 중복 회피, 개인정보/수치 금지

# 최종 출력 ONLY JSON (추가 텍스트 금지)
{
  "questions": [
    {"domain": "emotion",      "text": "..."},
    {"domain": "relationship", "text": "..."},
    {"domain": "recovery",     "text": "..."},
    {"domain": "action",       "text": "..."},
    {"domain": "goal",         "text": "..."}
  ]
}`;
  }

  protected autoQualityFilter(question: string): boolean {
    const bannedWords = ['욕설', '비속어', '금칙어']; // 실제 금칙어 리스트로 확장
    if (!question || question.length < 3) return false;
    for (const word of bannedWords) {
      if (question.includes(word)) return false;
    }
    // 반복/무의미(예: 같은 글자 반복 등) 필터 예시
    if (/^(.)\1{2,}$/.test(question)) return false;
    return true;
  }

  protected getDefaultQuestionSet(dayOfWeek: string): QuestionGenerationResponse {
    const seed: { [key: string]: string } = {
      monday: '새로운 한 주를 여는 감정은 무엇인가요?',
      tuesday: '오늘 마음을 가장 움직인 순간은?',
      wednesday: '주 중반 지금 마음에 가장 남은 행동은?',
      thursday: '오늘 작은 성취나 배움이 있었다면?',
      friday: '이번 주 나를 지탱해준 관계는?',
      saturday: '주말에 나를 회복시킨 순간은?',
      sunday: '다음 주를 위한 작은 다짐은?'
    };
    const base = seed[dayOfWeek.toLowerCase()] || '오늘 하루 가장 선명한 감정은 무엇인가요?';
    // 간단한 도메인 분포 기본 세트
    const questions: GeneratedQuestionItem[] = [
      { domain: 'emotion', text: base },
      { domain: 'relationship', text: '오늘 기억에 남는 대화나 상호작용이 있었나요?' },
      { domain: 'recovery', text: '오늘 나를 잠깐이라도 회복시킨 휴식은 무엇이었나요?' },
      { domain: 'action', text: '오늘 의미 있었던 작지만 구체적인 행동은 무엇이었나요?' },
      { domain: 'goal', text: '내일 스스로에게 약속하고 싶은 아주 작은 한 가지는?' }
    ];
    return {
      questions,
      confidence: 0.5,
      modelUsed: this.modelName,
      fallbackUsed: true,
    };
  }
}

// 확장 타입 정의
export interface FreeformJournal { date: string; content: string; emotionScore?: number; }

export interface EmotionTag { tag: string; intensity: number; }

export interface DailyCheckinInput {
  date: string;
  mood_1to10: number;
  energy_1to10: number;
  stress_1to10: number;
  sleep_hours_1to9p: number;
  sleep_quality_1to10: number;
  activity_types: string[];
  workout_intensity_1to10: number;
  focus_1to10: number;
  fatigue_1to10: number;
  social_count_1to10: number;
  social_satisfaction_1to10: number;
}

export interface BaselineCheckinInput extends Omit<DailyCheckinInput, 'date'> {}
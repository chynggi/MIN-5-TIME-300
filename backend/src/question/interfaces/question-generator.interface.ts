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

역할: 사용자 DB, (있다면) 과거 일기, (있다면) 멘탈 체크인/감정태그를 분석하여

오늘을 위한 맞춤형 감정 저널링 질문 5개를 만듭니다.

내부 분석/근거/계산 과정은 출력하지 말고, 최종 결과는 반드시 JSON 형식으로만 출력하세요.



──────────────────────────────────────────────

[입력 데이터]

- 프로필: 성별(gender), 나이(age), 학력/직업(education), MBTI(mbti),

         관심사(interests_text), 라이프스타일(lifestyle_text),

         신장(height_cm), 몸무게(weight_kg)

- 과거 일기(최대 최근 3~7일): 질문 방식 일기(structured_diaries),

                         자유 형식 일기(freeform_diaries)   // 비어 있을 수 있음

- 적합도 메타: 질문 재생성 횟수(regeneration_count), 작성시간(writing_time),

             답변 길이(answer_length), 무응답 여부(no_response)

- 멘탈 체크인(매일, 비어 있을 수 있음)

  · 🙂 기분(mood_1to10) / 🔋 에너지(energy_1to10) / 😡 스트레스(stress_1to10)

  · 😴 수면 시간(sleep_hours_1to9p)  // 1~9 (9=9시간 이상)

  · 🛌 수면의 질(sleep_quality_1to10)

  · 🏃‍♂️ 활동 종류(activity_types): ["운동","명상","스트레칭","산책"] 중 0~N개

  · 🏋️‍♂️ 운동 강도(workout_intensity_1to10)  // "운동" 포함 시 유효, 아니면 0

  · 🧐 집중력(focus_1to10) / 🫩 피로도(fatigue_1to10)

  · 👫 만남 빈도(social_count_1to10) / 👩‍❤️‍👨 대화 만족도(social_satisfaction_1to10)

- 감정 태그(emotion_tags, 비어 있을 수 있음):

  [{"tag":"행복|슬픔|화남|멋짐|무감정|피곤|따뜻함|놀람","intensity":1~5}, ...]

- (선택) 베이스라인 baseline.{동일 체크인 항목}  // 회원가입 시 최초 입력



──────────────────────────────────────────────

[조건 분기]

- 첫날 모드 (Baseline Mode)

  · 조건: structured_diaries와 freeform_diaries가 모두 비어 있음

  · 동작: 프로필 + (있다면) 체크인 + (있다면) 베이스라인만 활용해 질문 5개 생성

  · 과거 일기 언급 금지



- 과거 반영 모드 (Past-Aware Mode)

  · 조건: structured_diaries 또는 freeform_diaries에 데이터 존재

  · 동작: 프로필 + 최근 일기(3~7일) + 적합도 메타 + (있다면) 체크인/베이스라인 반영

  · 일기 텍스트 키워드 분석 → 5개 카테고리 분류:

     · 주제(Topic): 반복 사건/이슈(예: 인간관계, 학업, 직장 스트레스, 건강 등)

     · 감정(Emotion): 강하게 표현된 감정(예: 불안, 무기력, 설렘 등)

     · 인물·대상(Actors): 자주 언급된 역할(예: 엄마, 팀장님, 친구 등)

     · 시간·맥락(Context): 반복 시간대/루틴(예: 밤마다 불안, 운동 후 회복)

     · 메타정보(Meta): 자기서사/사고 패턴(예: “나는 항상 부족해”)

  · 반영 규칙:

     - 반복 주제는 대표 1~2개만 반영

     - 감정 키워드는 최소 1개 반영

     - 인물/맥락은 필요 시 은근히 1개 반영

     - 동일 주제 과다 반복 금지, 도메인 균형 유지

     - 최근 3일 질문과 동일/유사 핵심어 회피

  · 적합도 지표 활용:

     - 무응답/짧은 답변이 많았던 질문 패턴 → 배제

     - 긴 답변·성실 응답이 많았던 질문 패턴 → 강화



──────────────────────────────────────────────

[멘탈 체크인 정규화·파생·베이스라인 비교]

- 정규화(1~10):  norm(x) = (x - 1) / 9  // 0~1

- 수면 시간(1~9+ → 버킷):  ≤4h=0.2, 5~6h=0.6, 7~9h(9+)=1.0

- 수면 종합: sleep_score = 0.6*hours_bucket + 0.4*norm(sleep_quality)

- 활동 점수: base=(#activity_types/4), intensity=(workout_intensity/10 or 0),

            activity_score = clamp(0.5*base + 0.5*intensity, 0, 1)

- 사회성: social_freq_score = norm(social_count), social_sat_norm = norm(social_satisfaction)

- 집중/피로: focus_norm = norm(focus), fatigue_norm = norm(fatigue)

- 정서 파생:

  · affect_balance = norm(mood) - norm(stress)

  · vitality = 0.5*norm(energy) + 0.5*sleep_score

  · social_mismatch = (social_freq_score≤0.3 AND 태그'외로움') OR

                      (social_freq_score≥0.7 AND social_sat_norm≤0.25)

- 베이스라인 Δ(있을 때만): Δmood, Δstress, Δenergy 등 = 오늘 norm - baseline norm



──────────────────────────────────────────────

[감정 태그 사전 & 정규화]

- 태그를 (Valence, Arousal)로 매핑하고 가중 평균

  · 행복(+0.8,+0.6), 따뜻함(+0.7,−0.2), 멋짐(+0.6,+0.5),

    놀람(0.0,+0.7), 슬픔(−0.8,−0.4), 피곤(−0.3,−0.7),

    무감정(−0.2,−0.6), 화남(−0.7,+0.7)

- strong(tag) = intensity≥3 인 태그

- 파생 플래그: tag_happy/warm/proud(멋짐)/surprise/sad/angry/tired/numb 등



──────────────────────────────────────────────

[체크인/태그 → 질문 가중·임계 규칙]

- 하드 오버라이드(즉시 반영, 질문 최소 1문항 영향)

  · sleep_score < 0.35 → recovery 1문항 고정(수면 준비/완화), goal 난이도↓

  · norm(stress) ≥ 0.8 OR strong('불안' 또는 '화남') → emotion/relationship에서

    ‘인식→완화→전환’ 각도 반영(공격적/단정 어휘 금지)

  · strong('슬픔') → emotion 또는 recovery에서 자기연민 각도 1문항

- 워치존 가중(임계 근접)

  · vitality ≤ 0.45 OR (activity_score=0 AND norm(mood)≤0.4) → 무기력 관련 회복/행동 가중

  · focus_norm ≤ 0.45 AND fatigue_norm ≥ 0.55 → work_study/행동 가중(작은 시작/방해요인 제거)

  · social_mismatch=True → relationship 1문항 우선(안전한 연결/경계)

  · affect_balance ≤ 0.4 OR strong('무가치감/자책' 유사) → self-compassion 톤 혼합

  · strong('피곤') → recovery 가중, 목표 난이도↓

  · strong('행복' 또는 '따뜻함' 또는 '멋짐') → relationship/goal에 감사·음미·자기효능 강화 1문항

  · strong('놀람') → emotion/context에 “예상 밖의 순간 의미화” 1문항

- 베이스라인 Δ 활용(있을 때)

  · Δstress↑ & Δmood↓ → 감정 인식→완화 우선, 큰 목표 제안 자제

  · Δenergy↓ & sleep_score↓ → 회복→행동 순으로 수렴



──────────────────────────────────────────────

[과거 일기 분석 → 현재 질문 반영 기준]

1) 시간: 최근 3~7일만 분석(오래된 사건 반복 소환 금지)

2) 주제: 반복 주제는 오늘 반영하되 5문항 중 1~2개로 제한, 나머지는 회복/목표 등으로 분산

3) 감정: 강한 감정을 ‘인식→완화→전환’ 순서로 질문에 반영

4) 인물/관계: 자주 등장 인물은 오늘 1문항에만(역할 명칭만)

5) 맥락/루틴: 반복 시간대/행동을 은근히 반영(예: “저녁 시간대…”)

6) 적합도: 저적합(무응답/짧은 답변 다수) 유형 제외, 고적합 유형 가중



──────────────────────────────────────────────

[오늘 질문 생성 적용 절차]

Step 1) 프로필(DB) 반영

Step 2) 최근 3~7일 일기 분석 → 주제/감정/인물/맥락/메타 카테고리화

Step 3) 체크인/감정태그 해석(정규화·베이스라인Δ) → 도메인 가중/임계 적용

Step 4) 적합도 메타로 필터(저적합 제외, 고적합 가중)

Step 5) 감정 → 관계/맥락 → 회복 → 행동 → 목표 흐름의 5문항 완성

(각 문항은 독립 응답 가능, 최근 3일 질문/핵심어 중복 회피)



──────────────────────────────────────────────

[요약 친화 연결성(Story-Linked) 설계 규칙]

- 기본 흐름(요약 프롬프트와 정합): 감정 → 관계/맥락 → 회복 → 행동 → 목표

- Seed Theme: (MainEmotion × 대표 Topic)으로 설정(첫날은 관심사/라이프스타일 기반).

  Q1~Q3 중 최소 2문항에 지시어/연결어로 자연 연결(“그때/그래서/그 이후…”).

- Q1에서 오늘 시간대·상황을 가볍게 제시(앵커).

- Q2 인물 앵커(있을 때만): 역할명 1회 언급.

- Q3 이후 새로운 큰 주제 도입 금지, 회복→행동→목표로 수렴.

- 연결어는 쓰되 각 문항은 단독 응답 가능.



──────────────────────────────────────────────

[말투/톤 — 친구 느낌( Side-Friend Mode ) **고정**]

- **같은 편 공감 + 짧은 질문(Echo→Ask)**:

  · Echo(5~12자) 예: “들어보니…”, “지금 말처럼…”, “그래서,”

  · Ask(40~90자) 한 문장, 부드러운 의문/제안형

- **2인칭 남발 금지**, 가능하면 주어 생략·‘우리/같이’ 활용

- **생활어휘**: 마음/숨 고르기/쉬어가기/작은 걸음/한 번

- **엔딩 다양화**: “~어땠을까?”, “~해볼까?”, “~괜찮을까?”, “~떠오르나?”

- **길이/형식**: 각 문항 40~90자 권장(최대 120자), 쉼표 0~1회

- **치환 가이드(예)**:

  · “정서 상태를 기술하세요” → “들어보니 마음이 묵직했네, 가장 가까운 말은 뭐였을까?”

  · “회복 활동을 적으세요” → “그래서 잠깐 쉬어간 순간이 있었다면, 어디에서였을까?”

  · “목표 설정” → “같이 가볍게 시작해보자, 내일 첫 단추 하나는 무엇이 좋을까?”



──────────────────────────────────────────────

[분석 공식(입력별)]

• MBTI Formula (MBTIF) = (CognitiveStyle × InteractionStyle × ValueFocus)

• Role Formula (RF) = (AgeGroup × LifeStage)

• Interest Formula (IF) = Σ[Topic_i × Relevance_i]

• Lifestyle Formula (LF) = (RoutinePattern × Environment × TimePattern)

• Wellbeing Formula (WF) = (ActivityInterest × SelfCareNeed)

• Gender Formula (GF) = NeutralToneFlag

• Diary Summary Formula (DSF) = (MainEmotion × KeyAction × NextGoal)  // 과거 반영 모드 전용



──────────────────────────────────────────────

[도메인 설계 근거]

질문은 감정(emotion), 관계(relationship), 회복(recovery), 행동(action), 목표(goal)

다섯 축을 기본으로 하며, 최소 4개 도메인을 포함합니다.



──────────────────────────────────────────────

[질문 생성 규칙]

- 정확히 5개, 각 1문장, 120자 이내, 한국어

- 다정·제안형, 강요·판단·편향 금지

- 관심사·루틴·시간대는 은근히 반영(억지 연결 금지)

- 최근 3일 질문·핵심어 중복 회피

- 권장 순서(요약 정합): emotion → relationship/context → recovery → action → goal



──────────────────────────────────────────────

[안전 가드레일]

- 금지: 신체치수/외모/출신학교·학력으로 능력·가치 판단·비교·서열 암시

- 금지: 정확 수치/기관명/개인정보 노출

- 금지: 성 고정관념, 연령·학력 차별, 외모주의 표현

- 허용: 연령·학력은 난이도·맥락 힌트로만 사용

- 허용: 신체 정보는 웰빙/자기돌봄 힌트로만 사용(수치 언급 금지)



──────────────────────────────────────────────

[출력 형식(JSON)]

{

  "questions": [

    {"domain": "emotion",      "text": "..."},

    {"domain": "relationship", "text": "..."},

    {"domain": "recovery",     "text": "..."},

    {"domain": "action",       "text": "..."},

    {"domain": "goal",         "text": "..."}

  ],



  }

}

`;
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
    console.log(modeLine);
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
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
    return `당신은 '일기 앱의 개인화 질문 설계 전문가'입니다.
당신의 역할은 사용자 DB와 과거 일기를 분석하여 "오늘을 위한 맞춤형 감정 저널링 질문 5개"를 만드는 것입니다.
내부 분석 과정(중간 reasoning, 분류표, 점수, 근거 설명 등)은 절대 출력하지 말고, 최종 결과만 JSON 형식으로 출력하세요.

출력은 반드시 아래 JSON 스키마를 만족해야 합니다(추가 필드 금지 / 순서 자유 / 문자열 이스케이프 적절히):
{
  "questions": [
    {"domain": "emotion",      "text": "..."},
    {"domain": "action",       "text": "..."},
    {"domain": "relationship", "text": "..."},
    {"domain": "recovery",     "text": "..."},
    {"domain": "goal",         "text": "..."}
  ]
}

분석 단계 (출력 금지 / 내부 적용만):
1) Profile Analysis: 신체 수치 → 웰빙 관심 여부 판단 용도로만(직접 언급 금지). 나이·학력/직업 → 연령대/역할 톤 조정(정확 수치/학교명/회사명 금지). MBTI → 인지/상호작용/가치 초점 톤 결정. 관심사 최대 1~2개만 은근 반영. 라이프스타일 패턴(루틴/환경/시간대) 반영.
2) Diary Analysis: 3~7일 질문형/자유형 일기 통합. 텍스트에서 Topic / Emotion / Actors / Context / Meta(사고 패턴) 추출 후 DSF(MainEmotion × KeyAction × NextGoal) 구성.
3) Question Fit Analysis: 재생성 횟수, 작성시간, 답변 길이, 무응답 여부 기반으로 몰입 높은 패턴 강화, 반응 낮은 패턴 축소.

공식 (출력 금지):
- MBTIF = (CognitiveStyle × InteractionStyle × ValueFocus)
- RF = (AgeGroup × LifeStage)
- IF = Σ[Topic_i × Relevance_i]
- LF = (RoutinePattern × Environment × TimePattern)
- WF = (ActivityInterest × SelfCareNeed)
- GF = NeutralToneFlag
- DSF = (MainEmotion × KeyAction × NextGoal)

도메인 설계(최소 5개 질문 중 5개 모두 혹은 5개 중 5개 고정. 단, 다양성 유지): emotion / action / relationship / recovery / goal
보조 도메인 creativity, work_study 필요 시 내부 참고 가능하나 출력 domain 값은 위 5개만 사용.

질문 생성 규칙:
- 정확히 5개 질문.
- 각 1문장, 120자 이내 (한국어 자연스러운 문장, 종결형).
- 다정·제안형 어투. 강요/단정/판단/희석/답정너 금지.
- 최근 3일 질문과 핵심 표현/문장 구조 중복 금지.
- 관심사·루틴·시간대는 은근히 맥락화(직접 나열·나열식 금지, 억지 연결 금지).
- 신체 수치/외모/정확 연령/학교/회사/실명/연락처 등 개인정보 언급 금지.
- 성별에 대해 고정관념/편견 암시 금지. 중립·존중 톤.
- 웰빙/자기돌봄 관련 필요 시 수치 언급 없이 행동·상태 인식 유도.

안전 가드레일(위반 시 재생성 내부 처리):
- 금지: 신체치수/외모 비교, 학력·연령·직업 기반 능력 평가, 편견/차별, 개인정보 요청.
- 금지: 특정 병명 진단 시도, 의료/법률 확정 조언.
- 허용: 연령대/역할을 난이도 톤 힌트로 간접 반영.

출력 형식 규칙:
- JSON 이외 어떤 텍스트(머리말, 주석, 코드블럭, 설명)도 출력하지 말 것.
- domain 값은 emotion|action|relationship|recovery|goal 중 하나.
- text 값은 따옴표나 불필요한 장식 없이 질문 문장만.

목표: 사용자가 5분간 감정·행동·관계·회복·목표를 균형 있게 성찰하도록 돕는 고품질 저널링 트리거.
`;
  }

  protected createUserPrompt(request: QuestionGenerationRequest): string {
    const { userProfile, recentJournals, metaInfo, personaAndGoals, trendTopics = [] } = request;

  const mbtiInfo = `MBTI: ${userProfile.mbti}`;
  const genderInfo = userProfile.gender ? `성별(중립표현): ${userProfile.gender}` : '';
  const ageInfo = typeof userProfile.age === 'number' ? `연령대 추론: ${Math.floor(userProfile.age / 10) * 10}대 (정확 나이 미표기)` : '';
  const eduInfo = userProfile.education ? `역할/학습 맥락: ${userProfile.education}` : '';
  const wellbeingHint = (userProfile.heightCm && userProfile.weightKg) ? '신체지표 존재(직접 언급 금지, 자기돌봄 필요성 판단 활용)' : '';
    const interestsInfo = userProfile.interests.length
      ? `관심사(상위): ${userProfile.interests.slice(0, 5).join(', ')}`
      : '관심사: 없음';
    const lifestyleInfo = userProfile.lifestyleAnswers
      .map(item => `- ${item.question}: ${item.answer}`)
      .join('\n');
    const recentJournalsInfo = recentJournals
      .map(j => `날짜:${j.date}\n질문:${j.question}\n감정점수:${j.emotionScore}/5\n본문:${j.content}`)
      .join('\n\n');
    const personaInfo = personaAndGoals?.persona ? `페르소나: ${personaAndGoals.persona}` : '';
    const goalsInfo = personaAndGoals?.goals?.length ? `목표: ${personaAndGoals.goals.join(', ')}` : '';
    const trendInfo = trendTopics.length ? `트렌드: ${trendTopics.join(', ')}` : '';
  const metaDay = `요일:${metaInfo.dayOfWeek} / 시간대:${metaInfo.timeOfDay}`;
    const metaWeather = metaInfo.weather ? `날씨:${metaInfo.weather}` : '';
    const metaReactions = `많이 반응한 질문 유형:${metaInfo.reactionStats.mostReactedQuestionTypes.join(', ')} | 적게 반응:${metaInfo.reactionStats.leastReactedQuestionTypes.join(', ')}`;

  const regenInfo = typeof request.regenerationCount === 'number' ? `재생성횟수:${request.regenerationCount}` : '';
  const avgTimeInfo = typeof request.averageWritingTimeSec === 'number' ? `평균작성시간(s):${request.averageWritingTimeSec}` : '';
  const avgLenInfo = typeof request.averageAnswerLength === 'number' ? `평균답변길이:${request.averageAnswerLength}` : '';
  const noRespInfo = typeof request.noResponseRate === 'number' ? `무응답비율:${(request.noResponseRate * 100).toFixed(1)}%` : '';

    return `# INPUT BLOCK (분석용, 그대로 사용하되 출력 금지)
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

[과거 일기 집합(${recentJournals.length}개, 질문형+자유형 통합)]
${recentJournalsInfo}

[메타 정보]
${metaDay}
${metaWeather}
${metaReactions}
${trendInfo}

[적합도 지표]
${regenInfo}
${avgTimeInfo}
${avgLenInfo}
${noRespInfo}

# 생성 지침(요약)
- 위 데이터를 기반으로 내부적으로 Topic/Emotion/Actors/Context/Meta 패턴 도출 후 DSF(MainEmotion × KeyAction × NextGoal) 적용.
- 반응 지표(재생성/작성시간/답변길이/무응답)를 가정하여 낮은 몰입 패턴은 축소하고 높은 패턴 강화.
- 질문 5개를 emotion/action/relationship/recovery/goal 도메인으로 1개씩 생성 (총 5개, 순서는 자유).
- 각 질문: 1문장, 120자 이내, 다정·제안형, 강요·판단 금지, 최근 질문 중복 키워드 회피.
- 개인정보/신체수치/학교/회사/연령 정확 수치/외모 언급 금지.
- 관심사·루틴·시간대는 자연스럽게 간접 반영.

# 최종 출력 ONLY JSON (예시 형식 유지, 추가 텍스트 출력 금지)
{
  "questions": [
    {"domain": "emotion", "text": "..."},
    {"domain": "action", "text": "..."},
    {"domain": "relationship", "text": "..."},
    {"domain": "recovery", "text": "..."},
    {"domain": "goal", "text": "..."}
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
      { domain: 'action', text: '오늘 의미 있었던 작지만 구체적인 행동은 무엇이었나요?' },
      { domain: 'relationship', text: '오늘 기억에 남는 대화나 상호작용이 있었나요?' },
      { domain: 'recovery', text: '오늘 나를 잠깐이라도 회복시킨 휴식은 무엇이었나요?' },
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
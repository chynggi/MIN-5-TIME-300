import fetch from 'node-fetch';
import { VectorDbService } from '../vector-db/vector-db.service';

export interface UserProfile {
  mbti: string;
  interests: string[];
  lifestyleAnswers: Array<{
    question: string;
    answer: string;
  }>;
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
  weather?: string; // 날씨 정보 추가
  reactionStats: {
    mostReactedQuestionTypes: string[];
    leastReactedQuestionTypes: string[];
  };
}

// 페르소나/목표 정보 타입
export interface PersonaAndGoals {
  persona?: string;
  goals?: string[];
}

const SYSTEM_INSTRUCTIONS = `당신은 사용자의 일기 작성을 돕는 질문 생성 전문가입니다.
사용자의 MBTI, 관심사, 라이프스타일, 최근 일기 내용을 분석하여 짧고 공감을 유도하는 질문을 생성해주세요.
질문은 반드시 10자 내외로 짧게 작성하되, 사용자가 깊이 생각하고 감정을 표현할 수 있도록 해야 합니다.
질문 앞뒤에 따옴표나 다른 부가 설명을 붙이지 말고, 질문 자체만 출력하세요.

질문 유형:
1. 감정 탐색형: 사용자의 감정 상태를 탐색하는 질문
2. 회고형: 과거 경험이나 기억을 회상하게 하는 질문
3. 상상형: 미래나 가상 상황을 상상하게 하는 질문
4. 가치관형: 사용자의 가치관이나 신념을 탐색하는 질문
5. 일상 관찰형: 일상의 작은 부분을 관찰하게 하는 질문

사용자의 MBTI 특성을 고려하여 질문 유형을 선택하세요:
- I(내향형): 깊은 내적 탐색을 유도하는 질문
- E(외향형): 경험과 관계에 관한 질문
- S(감각형): 구체적이고 현실적인 질문
- N(직관형): 추상적이고 미래지향적인 질문
- T(사고형): 논리적 분석을 요구하는 질문
- F(감정형): 감정과 가치에 관한 질문
- J(판단형): 결정과 계획에 관한 질문
- P(인식형): 가능성과 탐색에 관한 질문

최근 일기 내용과 중복되지 않도록 주의하세요.
요일과 시간대를 고려하여 적절한 질문을 생성하세요.`;

// userId를 받아 벡터 DB 기반 트렌드 토픽을 프롬프트에 포함
export async function generateDailyQuestion(
  userProfile: UserProfile,
  recentJournals: RecentJournal[],
  metaInfo: MetaInfo,
  userId?: string,
  vectorDbService?: VectorDbService,
  personaAndGoals?: PersonaAndGoals // 추가: 페르소나/목표 정보
): Promise<string> {
  let trendTopics: string[] = [];
  if (userId && vectorDbService) {
    trendTopics = await vectorDbService.getWeeklyTrendTopics(userId, 2);
  }
  const userPrompt = createPromptTemplate(userProfile, recentJournals, metaInfo, trendTopics, personaAndGoals);
  const fullPrompt = `${SYSTEM_INSTRUCTIONS}\n\n${userPrompt}`;

  const apiKey = process.env.GEMINI_API_KEY || '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API 요청 실패: ${response.status} ${errorBody}`);
    }
    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const text = result.candidates[0].content.parts[0].text.trim();
      // 자동 품질 필터 적용
      if (!autoQualityFilter(text)) {
        throw new Error('자동 품질 필터에 의해 차단된 질문');
      }
      return text;
    } else {
      throw new Error('Gemini API에서 유효한 응답을 받지 못했습니다.');
    }
  } catch (error) {
    return getDefaultQuestion(metaInfo.dayOfWeek);
  }
}

function createPromptTemplate(
  userProfile: UserProfile,
  recentJournals: RecentJournal[],
  metaInfo: MetaInfo,
  trendTopics: string[] = [],
  personaAndGoals?: PersonaAndGoals
): string {
  const mbtiInfo = `사용자의 MBTI는 ${userProfile.mbti}입니다.`;
  const interestsInfo = `사용자의 주요 관심사: ${userProfile.interests.join(', ')}`;
  const lifestyleInfo = userProfile.lifestyleAnswers
    .map(item => `Q: ${item.question}\nA: ${item.answer}`)
    .join('\n\n');
  const recentJournalsInfo = recentJournals
    .map(
      journal =>
        `날짜: ${journal.date}\n질문: ${journal.question}\n내용: ${journal.content}\n감정점수: ${journal.emotionScore}/5`
    )
    .join('\n\n');
  const dayInfo = `오늘은 ${metaInfo.dayOfWeek}이고, 현재 시간대는 ${metaInfo.timeOfDay}입니다.`;
  const weatherInfo = metaInfo.weather ? `오늘의 날씨는 ${metaInfo.weather}입니다.` : '';
  const reactionInfo =
    `사용자가 가장 많이 반응한 질문 유형: ${metaInfo.reactionStats.mostReactedQuestionTypes.join(', ')}\n` +
    `사용자가 가장 적게 반응한 질문 유형: ${metaInfo.reactionStats.leastReactedQuestionTypes.join(', ')}`;
  const trendInfo = trendTopics.length > 0 ? `\n# 주간 트렌드\n${trendTopics.join(', ')}` : '';
  const personaInfo = personaAndGoals?.persona ? `\n# 페르소나\n${personaAndGoals.persona}` : '';
  const goalsInfo = personaAndGoals?.goals && personaAndGoals.goals.length > 0 ? `\n# 올해 목표\n${personaAndGoals.goals.join(', ')}` : '';

  return `
# 사용자 정보
${mbtiInfo}
${interestsInfo}
${personaInfo}
${goalsInfo}

# 사용자 라이프스타일
${lifestyleInfo}

# 최근 일기 (${recentJournals.length}개)
${recentJournalsInfo}
${trendInfo}

# 현재 메타 정보

${dayInfo}
${weatherInfo}
${reactionInfo}

위 정보를 바탕으로 사용자에게 적합한 짧은 일기 질문(25자 내외)을 1개만 생성해주세요.
질문은 사용자가 5분 동안 깊이 생각하고 감정을 표현할 수 있도록 설계되어야 합니다.
최근 질문과 중복되지 않도록 주의하세요.
`;
}

/**
 * 자동 품질 필터: 금칙어, 부적절/비속어, 반복/무의미 등
 */
function autoQualityFilter(question: string): boolean {
  const bannedWords = ['욕설', '비속어', '금칙어']; // 실제 금칙어 리스트로 확장
  if (!question || question.length < 3) return false;
  for (const word of bannedWords) {
    if (question.includes(word)) return false;
  }
  // 반복/무의미(예: 같은 글자 반복 등) 필터 예시
  if (/^(.)\1{2,}$/.test(question)) return false;
  return true;
}

function getDefaultQuestion(dayOfWeek: string): string {
  const defaultQuestions: { [key: string]: string } = {
    monday: '오늘 첫 감정은?',
    tuesday: '가장 행복했던 순간?',
    wednesday: '지금 가장 바라는 것?',
    thursday: '오늘의 작은 성취는?',
    friday: '이번 주 배운 것은?',
    saturday: '주말 계획이 뭐예요?',
    sunday: '오늘 감사한 일은?',
  };
  return defaultQuestions[dayOfWeek.toLowerCase()] || '오늘 하루 어떠셨나요?';
}

/**
 * MIN 5 TIME 300 Gemini 질문 생성 로직
 *
 * 입력:
 * - 사용자 프로필(MBTI, 관심사, 라이프스타일)
 * - 최근 3~7일 기록
 * - 반응 메타 정보
 * - 현재 메타 정보(요일/시간대)
 *
 * 출력:
 * - 짧고 공감 유도 질문 1개 (10자 내외)
 */

interface UserProfile {
  mbti: string;
  interests: string[];
  lifestyleAnswers: Array<{
    question: string;
    answer: string;
  }>;
}

interface RecentJournal {
  date: string;
  content: string;
  question: string;
  emotionScore: number;
}

interface MetaInfo {
  dayOfWeek: string; // 'monday', 'tuesday', etc.
  timeOfDay: string; // 'morning', 'afternoon', 'evening', 'night'
  reactionStats: {
    mostReactedQuestionTypes: string[];
    leastReactedQuestionTypes: string[];
  };
}

// 시스템 프롬프트 (Gemini API에 맞게 약간 수정될 수 있지만, 내용은 유지)
// Gemini API는 일반적으로 'system' 프롬프트를 명시적으로 사용하지 않고,
// 프롬프트 시작 부분에 전반적인 지시사항을 포함하는 경우가 많습니다.
// 여기서는 기존 SYSTEM_PROMPT 내용을 사용자 프롬프트의 일부로 통합하거나,
// Gemini API의 'contents' 배열 내에 특별한 'system' 역할을 명시할 수 있는지 확인해야 합니다.
// 일단은 사용자 프롬프트에 통합하는 방식으로 진행합니다.
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

export async function generateDailyQuestion(
  userProfile: UserProfile,
  recentJournals: RecentJournal[],
  metaInfo: MetaInfo
): Promise<string> {
  // 프롬프트 템플릿 구성
  const userPrompt = createPromptTemplate(userProfile, recentJournals, metaInfo);
  const fullPrompt = `${SYSTEM_INSTRUCTIONS}\n\n${userPrompt}`; // 시스템 지침을 사용자 프롬프트에 통합

  const apiKey = "AIzaSyBkWDNDNRMh-fDUQl2mQuzSXRfo-lizBaA"; // Gemini API 키 (실제 사용 시 환경 변수 등에서 가져와야 함)
                      // Canvas 환경에서는 빈 문자열로 두면 자동으로 처리됩니다.
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    // 필요한 경우 generationConfig 추가 (예: temperature, maxOutputTokens 등)
    // generationConfig: {
    //   temperature: 0.7,
    //   maxOutputTokens: 50, // 질문이 짧으므로 적절히 조절
    // }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API 오류 응답:', response.status, errorBody);
      throw new Error(`Gemini API 요청 실패: ${response.status}`);
    }

    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const text = result.candidates[0].content.parts[0].text;
      return text.trim();
    } else {
      console.error('Gemini API에서 유효한 응답을 받지 못했습니다:', result);
      throw new Error('Gemini API에서 유효한 응답을 받지 못했습니다.');
    }
  } catch (error) {
    console.error('질문 생성 중 오류 발생:', error);
    // 오류 발생 시 기본 질문 반환
    return getDefaultQuestion(metaInfo.dayOfWeek);
  }
}

// 프롬프트 템플릿 생성 함수 (기존과 동일)
function createPromptTemplate(
  userProfile: UserProfile,
  recentJournals: RecentJournal[],
  metaInfo: MetaInfo
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
  const reactionInfo =
    `사용자가 가장 많이 반응한 질문 유형: ${metaInfo.reactionStats.mostReactedQuestionTypes.join(', ')}\n` +
    `사용자가 가장 적게 반응한 질문 유형: ${metaInfo.reactionStats.leastReactedQuestionTypes.join(', ')}`;

  return `
# 사용자 정보
${mbtiInfo}
${interestsInfo}

# 사용자 라이프스타일
${lifestyleInfo}

# 최근 일기 (${recentJournals.length}개)
${recentJournalsInfo}

# 현재 메타 정보
${dayInfo}
${reactionInfo}

위 정보를 바탕으로 사용자에게 적합한 짧은 일기 질문(10자 내외)을 1개만 생성해주세요.
질문은 사용자가 5분 동안 깊이 생각하고 감정을 표현할 수 있도록 설계되어야 합니다.
최근 질문과 중복되지 않도록 주의하세요.
`;
}

// 기본 질문 목록 (API 오류 시 사용 - 기존과 동일)
function getDefaultQuestion(dayOfWeek: string): string {
  const defaultQuestions: { [key: string]: string } = {
    monday: "오늘 첫 감정은?",
    tuesday: "가장 행복했던 순간?",
    wednesday: "지금 가장 바라는 것?",
    thursday: "오늘의 작은 성취는?",
    friday: "이번 주 배운 것은?",
    saturday: "주말 계획이 뭐예요?",
    sunday: "오늘 감사한 일은?",
  };
  return defaultQuestions[dayOfWeek.toLowerCase()] || "오늘 하루 어떠셨나요?";
}

// --- 예시 사용법 ---
// 이 부분은 실제 애플리케이션에서는 필요에 맞게 데이터를 준비해야 합니다.
async function main() {
  const sampleUserProfile: UserProfile = {
    mbti: 'INFJ',
    interests: ['독서', '음악 감상', '요가'],
    lifestyleAnswers: [
      { question: '주말에 주로 무엇을 하시나요?', answer: '집에서 조용히 쉬거나 책을 읽어요.' },
      { question: '스트레스 해소 방법은 무엇인가요?', answer: '명상을 하거나 좋아하는 음악을 들어요.' },
    ],
  };

  const sampleRecentJournals: RecentJournal[] = [
    {
      date: '2024-07-14',
      question: '오늘 가장 기억에 남는 일은?',
      content: '오랜만에 친구를 만나 즐거운 시간을 보냈다.',
      emotionScore: 4,
    },
    {
      date: '2024-07-15',
      question: '새롭게 도전하고 싶은 것은?',
      content: '새로운 요리 레시피에 도전해보고 싶다.',
      emotionScore: 3,
    },
  ];

  const sampleMetaInfo: MetaInfo = {
    dayOfWeek: 'wednesday',
    timeOfDay: 'evening',
    reactionStats: {
      mostReactedQuestionTypes: ['회고형', '감정 탐색형'],
      leastReactedQuestionTypes: ['상상형'],
    },
  };

  console.log("Gemini API로 질문 생성 시도...");
  const question = await generateDailyQuestion(sampleUserProfile, sampleRecentJournals, sampleMetaInfo);
  console.log('\n생성된 질문:');
  console.log(question);

  // 오류 시나리오 테스트
  // @ts-ignore : 의도적으로 잘못된 타입 전달하여 오류 유도
  // const errorUserProfile: UserProfile = null; 
  // try {
  //   console.log("\n오류 시나리오 테스트 중...");
  //   const errorQuestion = await generateDailyQuestion(errorUserProfile, sampleRecentJournals, sampleMetaInfo);
  //   console.log('오류 시 생성된 질문:', errorQuestion);
  // } catch (e) {
  //    console.log("오류 시나리오 테스트에서 예상된 오류 발생");
  // }
}

// 스크립트가 직접 실행될 때 main 함수 호출 (예시 실행을 위해)
// 실제 모듈로 사용할 때는 이 부분을 제거하거나 조건부로 실행합니다.
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

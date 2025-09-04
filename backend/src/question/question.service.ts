import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { TodayQuestionDto } from './dto/today-question.dto';
import { VoteQuestionDto } from './dto/vote-question.dto';
import { PrismaService } from '../prisma.service';
import { ProfileService } from '../profile/profile.service';
import { DiaryService } from '../diary/diary.service';
import { VectorDbService } from '../vector-db/vector-db.service';
import { QuestionGeneratorFactory } from './generators/question-generator.factory';
import { 
  AIModel, 
  QuestionGenerationRequest, 
  QuestionGenerationResponse,
  UserProfile, 
  RecentJournal, 
  MetaInfo,
  PersonaAndGoals,
  GeneratedQuestionItem 
} from './interfaces/question-generator.interface';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly diaryService: DiaryService,
    private readonly vectorDbService: VectorDbService,
  ) {}

  async getToday(req: any): Promise<TodayQuestionDto> {
    // 기존 로직 유지
    return {
      id: 'mock-qid',
      question: '오늘의 질문입니다.',
      createdAt: new Date().toISOString(),
    };
  }

  async vote(req: any, dto: VoteQuestionDto): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: dto.isHelpful ? '도움이 되었습니다.' : '도움이 되지 않았습니다.',
    };
  }

  async generate(req: any, preferredModel?: AIModel): Promise<any> {
    const userId = req.user.userId;
    
    // 1. 사용자 프로필 정보
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true,
        lifestyleAnswers: true,
      },
    });
    if (!user) throw new ForbiddenException('유저 정보 없음');
    
    const userProfile: UserProfile = {
      mbti: user.mbti ?? '',
      interests: user.interests.map(i => i.interest),
      lifestyleAnswers: user.lifestyleAnswers.map(a => ({ question: a.question, answer: a.answer })),
    };

    // 2. 최근 7일 일기
    const recentJournalsRaw = await this.prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 7,
      include: { question: true },
    });
    const recentJournals: RecentJournal[] = recentJournalsRaw.map(j => ({
      date: j.createdAt.toISOString().slice(0, 10),
      content: j.content,
      question: j.question?.question ?? '',
      emotionScore: j.emotionScore,
    }));

    // 3. 메타 정보(요일/시간대/반응)
    const now = new Date();
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const hours = now.getHours();
    let timeOfDay = 'morning';
    if (hours >= 6 && hours < 12) timeOfDay = 'morning';
    else if (hours >= 12 && hours < 18) timeOfDay = 'afternoon';
    else if (hours >= 18 && hours < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    const metaInfo: MetaInfo = {
      dayOfWeek: days[now.getDay()],
      timeOfDay,
      reactionStats: {
        mostReactedQuestionTypes: [],
        leastReactedQuestionTypes: [],
      },
    };

    // 4. 벡터 DB 기반 트렌드 토픽 조회
    let trendTopics: string[] = [];
    try {
      trendTopics = await this.vectorDbService.getWeeklyTrendTopics(userId, 2);
    } catch (error) {
      console.log('벡터 DB 트렌드 조회 실패:', error);
    }

    // 5. 페르소나/목표 정보 (추후 확장)
    const personaAndGoals: PersonaAndGoals = {
      persona: undefined, // 추후 persona 필드 추가시 구현
      goals: [], // 추후 goals 테이블 추가시 구현
    };

    // 6. AI 모델 선택 및 폴백 시스템
    const selectedModel = preferredModel || QuestionGeneratorFactory.getDefaultModel();
    
    // 7. 질문 생성 요청 준비
    // 7-a. 메트릭 계산 (최근 일기 기반)
    const validJournals = recentJournalsRaw.filter(j => !!j.content);
    const averageWritingTimeSec = validJournals.length
      ? Math.round(validJournals.reduce((acc, j) => acc + (j.writingDuration || 0), 0) / validJournals.length)
      : undefined;
    const averageAnswerLength = validJournals.length
      ? Math.round(validJournals.reduce((acc, j) => acc + j.content.length, 0) / validJournals.length)
      : undefined;
    // 무응답 비율: 질문이 있었지만 내용이 매우 짧거나 없는 경우 (threshold < 5 chars)
    const noResponseCount = validJournals.filter(j => (j.question && (!j.content || j.content.trim().length < 5))).length;
    const noResponseRate = validJournals.length ? noResponseCount / validJournals.length : undefined;

    const regenerationCount = 0; // TODO: 재생성 로그 테이블 도입 후 실제 값 반영

    const questionRequest: QuestionGenerationRequest = {
      userProfile,
      recentJournals,
      metaInfo,
      userId,
      personaAndGoals,
      trendTopics,
      regenerationCount,
      averageWritingTimeSec,
      averageAnswerLength,
      noResponseRate,
    };
    
    // 8. 다중 모델 폴백으로 질문 생성 시도
    const response = await this.generateWithFallback(questionRequest, selectedModel);

    // 새 다중 질문 응답 구조
    return {
      id: `${response.modelUsed}-set-${Date.now()}`,
      createdAt: new Date().toISOString(),
      model: response.modelUsed,
      fallback: response.fallbackUsed,
      confidence: response.confidence,
      questions: response.questions,
    };
  }

  /**
   * 다중 모델 폴백으로 질문 생성
   */
  private async generateWithFallback(
    request: QuestionGenerationRequest, 
    preferredModel: AIModel
  ): Promise<QuestionGenerationResponse> {
    // 안정성 순으로 모델 목록 가져오기
    const modelsByStability = QuestionGeneratorFactory.getModelsByStability();
    
    // 사용자가 선택한 모델을 최우선으로, 나머지는 안정성 순
    const modelsToTry = [
      preferredModel,
      ...modelsByStability.filter(model => model !== preferredModel)
    ];

    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      try {
        console.log(`${modelId} 모델로 질문 생성 시도...`);
        const generator = QuestionGeneratorFactory.getGenerator(modelId);
        const response = await generator.generateQuestion(request);
        
        if (response.questions && response.questions.length > 0) {
          console.log(`${modelId} 모델로 질문 생성 성공`);
          return response;
        }
      } catch (error) {
        console.log(`${modelId} 모델 실패:`, error.message);
        lastError = error;
        
        // 특정 오류는 다른 모델로 재시도하지 않음
        if (error.message.includes('API key') || error.message.includes('unauthorized')) {
          console.log(`${modelId}: API 키 문제로 건너뜀`);
          continue;
        }
      }
    }

    // 모든 모델 실패시 기본 질문 반환
    console.log('모든 AI 모델 실패. 기본 질문 사용');
    return this.getDefaultQuestionSet(request.metaInfo.dayOfWeek);
  }

  /**
   * 긴급 상황용 기본 질문
   */
  // getEmergencyQuestion 제거: getDefaultQuestionSet 사용

  // 사용 가능한 AI 모델 목록 조회
  async getAvailableModels(): Promise<{
    models: string[];
    defaultModel: string;
    enabledModels: string[];
  }> {
    return {
      models: QuestionGeneratorFactory.getAvailableModels(),
      defaultModel: QuestionGeneratorFactory.getDefaultModel(),
      enabledModels: QuestionGeneratorFactory.getEnabledModels(),
    };
  }

  // 로컬 폴백: 제너레이터 추상 클래스의 protected 메서드에 접근할 수 없으므로 동일 로직 구현
  private getDefaultQuestionSet(dayOfWeek: string): QuestionGenerationResponse {
    const seed: { [key: string]: string } = {
      monday: '새로운 한 주를 여는 감정은 무엇인가요?',
      tuesday: '오늘 마음을 가장 움직인 순간은?',
      wednesday: '주 중반 지금 마음에 가장 남은 행동은?',
      thursday: '오늘 작은 성취나 배움이 있었다면?',
      friday: '이번 주 나를 지탱해준 관계는?',
      saturday: '주말에 나를 회복시킨 순간은?',
      sunday: '다음 주를 위한 작은 다짐은?'
    };
    const base = seed[dayOfWeek?.toLowerCase()] || '오늘 하루 가장 선명한 감정은 무엇인가요?';
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
      modelUsed: 'fallback',
      fallbackUsed: true,
    };
  }
}

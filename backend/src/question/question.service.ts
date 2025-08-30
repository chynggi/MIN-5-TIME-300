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
  PersonaAndGoals 
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

  async generate(req: any, preferredModel?: AIModel): Promise<TodayQuestionDto> {
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
    const questionRequest: QuestionGenerationRequest = {
      userProfile,
      recentJournals,
      metaInfo,
      userId,
      personaAndGoals,
      trendTopics,
    };
    
    // 8. 다중 모델 폴백으로 질문 생성 시도
    const response = await this.generateWithFallback(questionRequest, selectedModel);

    return {
      id: `${response.modelUsed}-q-${Date.now()}`,
      question: response.question,
      createdAt: new Date().toISOString(),
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
        
        if (response.question && response.question.trim().length > 0) {
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
    return {
      question: this.getEmergencyQuestion(request.metaInfo.dayOfWeek),
      confidence: 0.5,
      modelUsed: 'fallback',
      fallbackUsed: true,
    };
  }

  /**
   * 긴급 상황용 기본 질문
   */
  private getEmergencyQuestion(dayOfWeek: string): string {
    const emergencyQuestions: { [key: string]: string } = {
      monday: '새로운 한 주, 어떤 마음으로 시작하시나요?',
      tuesday: '오늘 하루 중 가장 인상 깊었던 순간은?',
      wednesday: '이번 주 중반, 지금 기분은 어떠신가요?',
      thursday: '오늘 새롭게 깨달은 것이 있다면?',
      friday: '이번 주를 돌아보며 느끼는 감정은?',
      saturday: '주말을 맞아 하고 싶은 일은?',
      sunday: '오늘 하루 어떻게 보내셨나요?',
    };
    return emergencyQuestions[dayOfWeek.toLowerCase()] || '오늘 하루 어떠셨나요?';
  }

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
}

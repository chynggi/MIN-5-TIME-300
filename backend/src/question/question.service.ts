import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { TodayQuestionDto } from './dto/today-question.dto';
import { VoteQuestionDto } from './dto/vote-question.dto';
import { generateDailyQuestion, UserProfile, RecentJournal, MetaInfo } from './gemini-question.service';
import { PrismaService } from '../prisma.service';
import { ProfileService } from '../profile/profile.service';
import { DiaryService } from '../diary/diary.service';
import { VectorDbService } from '../vector-db/vector-db.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly diaryService: DiaryService,
    private readonly vectorDbService: VectorDbService, // 추가
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

  async generate(req: any): Promise<TodayQuestionDto> {
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
    // 반응 메타는 간단히 빈 배열로 대체(추후 확장)
    const metaInfo: MetaInfo = {
      dayOfWeek: days[now.getDay()],
      timeOfDay,
      reactionStats: {
        mostReactedQuestionTypes: [],
        leastReactedQuestionTypes: [],
      },
    };

    // 4. Gemini API 호출 (벡터 DB 기반 트렌드 포함)
    const questionText = await generateDailyQuestion(
      userProfile,
      recentJournals,
      metaInfo,
      userId,
      this.vectorDbService
    );
    return {
      id: 'gemini-q-' + Date.now(),
      question: questionText,
      createdAt: new Date().toISOString(),
    };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { RateDiaryDto } from './dto/rate-diary.dto';
import { DiaryListResponseDto, DiaryDetailResponseDto } from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayQuestion(req: any): Promise<TodayQuestionResponseDto> {
    // 예시: 가장 최근 질문 반환
    const question = await this.prisma.journalQuestion.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!question) throw new NotFoundException('오늘의 질문이 없습니다.');
    return {
      question: question.question,
      questionId: question.id,
      createdAt: question.createdAt.toISOString(),
    };
  }

  async getDiaries(req: any, query: any): Promise<DiaryListResponseDto> {
    const userId = req.user.userId;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (query.startDate && query.endDate) {
      where.createdAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }
    if (query.emotionScore) {
      where.emotionScore = Number(query.emotionScore);
    }
    const [diaries, totalCount] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.journal.count({ where }),
    ]);
    return {
      diaries: diaries.map(d => ({
        id: d.id,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        isPublic: d.isPublic,
        emotionScore: d.emotionScore,
        mediaUrl: d.mediaUrl ?? undefined,
        mediaType: d.mediaType ?? undefined,
        question: '', // 추후 질문 연동
      })),
      totalCount,
      page,
      limit,
    };
  }

  async getDiary(req: any, id: string): Promise<DiaryDetailResponseDto> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('본인 일기만 조회할 수 있습니다.');
    return {
      id: diary.id,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
      isPublic: diary.isPublic,
      emotionScore: diary.emotionScore,
      mediaUrl: diary.mediaUrl ?? undefined,
      mediaType: diary.mediaType ?? undefined,
      question: '', // 추후 질문 연동
      writingDuration: diary.writingDuration,
      reactions: [], // 추후 구현
    };
  }

  async createDiary(req: any, dto: CreateDiaryDto): Promise<{ id: string; content: string; createdAt: string; isPublic: boolean; question: string }> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.create({
      data: {
        userId,
        content: dto.content,
        isPublic: dto.isPublic ?? false,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        writingDuration: dto.writingDuration,
        emotionScore: 0,
      },
    });
    return {
      id: diary.id,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      isPublic: diary.isPublic,
      question: '', // 추후 질문 연동
    };
  }

  async rateDiary(req: any, id: string, dto: RateDiaryDto): Promise<{ id: string; emotionScore: number; updatedAt: string }> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('본인 일기만 평가할 수 있습니다.');
    const updated = await this.prisma.journal.update({
      where: { id },
      data: { emotionScore: dto.emotionScore },
    });
    return {
      id: updated.id,
      emotionScore: updated.emotionScore,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async shareDiary(req: any, id: string, isPublic: boolean): Promise<{ id: string; isPublic: boolean; updatedAt: string }> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('본인 일기만 공유 설정할 수 있습니다.');
    const updated = await this.prisma.journal.update({
      where: { id },
      data: { isPublic },
    });
    return {
      id: updated.id,
      isPublic: updated.isPublic,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

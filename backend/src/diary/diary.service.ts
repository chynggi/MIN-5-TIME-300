import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Multer } from 'multer';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { RateDiaryDto } from './dto/rate-diary.dto';
import { DiaryListResponseDto, DiaryDetailResponseDto } from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';
import { PrismaService } from '../prisma.service';
import { VectorDbService } from '../vector-db/vector-db.service';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDbService: VectorDbService,
  ) {}

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

  async createDiary(
    req: any,
    dto: CreateDiaryDto,
    file?: Multer.File,
  ): Promise<{ id: string; content: string; createdAt: string; isPublic: boolean; question: string; mediaUrl?: string; mediaType?: string }> {
    const userId = req.user.userId;
    let mediaUrl: string | undefined = undefined;
    let mediaType: string | undefined = undefined;
    // 파일이 있으면 저장 (여기서는 uploads 폴더에 저장, 실제 서비스에서는 S3 등 외부 저장 권장)
    if (file) {
      const fs = await import('fs');
      const path = await import('path');
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      const filename = `${Date.now()}_${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      mediaUrl = `/uploads/${filename}`;
      mediaType = file.mimetype;
    }
    const diary = await this.prisma.journal.create({
      data: {
        userId,
        content: dto.content,
        isPublic: dto.isPublic ?? false,
        mediaUrl,
        mediaType,
        writingDuration: dto.writingDuration,
        emotionScore: 0,
      },
    });

    // 일기 저장 후 임베딩 생성 및 Pinecone upsert
    try {
      const embedding = await this.vectorDbService.getCombinedEmbedding([diary.content]);
      if (embedding) {
        const index = this.vectorDbService['pinecone'].index(this.vectorDbService['indexName']);
        await index.upsert([
          {
            id: diary.id,
            values: embedding,
            metadata: {
              userId,
              type: 'diary',
              createdAt: diary.createdAt.toISOString(),
            },
          },
        ]);
      }
    } catch (e) {
      // 임베딩/업서트 실패 시 무시 (로깅 등 추가 가능)
    }

    return {
      id: diary.id,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      isPublic: diary.isPublic,
      question: '', // 추후 질문 연동
      mediaUrl,
      mediaType,
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

  /**
   * 입력 텍스트(또는 최근 일기) 기반 유사 일기 추천
   */
  async searchSimilarDiaries(req: any, text?: string, limit = 5) {
    const userId = req.user.userId;
    let embedding: number[] | null = null;
    if (text) {
      embedding = await this.vectorDbService.getCombinedEmbedding([text]);
    } else {
      // 최근 일기 3개 내용 기반 평균 임베딩
      const recent = await this.prisma.journal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      const texts = recent.map(d => d.content);
      embedding = await this.vectorDbService.getCombinedEmbedding(texts);
    }
    if (!embedding) return [];
    // Pinecone에서 유사 일기 검색 (type: 'diary')
    const index = this.vectorDbService['pinecone'].index(this.vectorDbService['indexName']);
    const queryResult = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: { type: 'diary' },
    });
    // 일기 ID 추출 및 DB 조회
    const ids = (queryResult.matches || []).map((m: any) => m.id);
    if (!ids.length) return [];
    const diaries = await this.prisma.journal.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'desc' },
    });
    // 결과 정렬: Pinecone 순서대로
    const idToDiary = Object.fromEntries(diaries.map(d => [d.id, d]));
    return ids.map((id: string) => idToDiary[id]).filter(Boolean);
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommunityDiaryListResponseDto } from './dto/community-diary.dto';
import { FeedbackDto, FeedbackResponseDto } from './dto/feedback.dto';
import { PrismaService } from '../prisma.service';
import { VectorDbService } from '../vector-db/vector-db.service';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDbService: VectorDbService,
  ) {}

  async getDiaries(req: any, query: any): Promise<CommunityDiaryListResponseDto> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const where: any = { isPublic: true };
    if (query.mbtiFilter) {
      where.user = { mbti: query.mbtiFilter };
    }
    // Prisma.SortOrder 사용
    const orderBy = query.sortBy === 'popular'
      ? { emotionScore: 'desc' as const }
      : { createdAt: 'desc' as const };
    const [diaries, totalCount] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: true,
          communityComments: true,
          reactions: true,
        },
      }),
      this.prisma.journal.count({ where }),
    ]);
    // 질문 연동: 각 일기별로 journalQuestion 조회
    const questionMap: Record<string, string> = {};
    const questionIds = diaries.map(d => d.id);
    const questions = await this.prisma.journalQuestion.findMany({
      where: { journalId: { in: questionIds } },
    });
    questions.forEach(q => { questionMap[q.journalId] = q.question; });
    return {
      diaries: diaries.map(d => ({
        id: d.id,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
        isPublic: d.isPublic,
        emotionScore: d.emotionScore,
        mediaUrl: d.mediaUrl ?? undefined,
        mediaType: d.mediaType ?? undefined,
        question: questionMap[d.id] || '',
        user: d.user ? {
          id: d.user.id,
          username: d.user.username,
          mbti: d.user.mbti ?? '',
          profileImageUrl: d.user.profileImageUrl || undefined,
        } : { id: '', username: '', mbti: '', profileImageUrl: undefined },
        reactionCounts: {
          like: d.reactions?.filter(r => r.reactionType === 'like').length ?? 0,
          hug: d.reactions?.filter(r => r.reactionType === 'hug').length ?? 0,
          support: d.reactions?.filter(r => r.reactionType === 'support').length ?? 0,
        },
        commentCount: d.communityComments?.length ?? 0,
        lat: d.lat ?? undefined,
        lng: d.lng ?? undefined,
      })),
      totalCount,
      page,
      limit,
    };
  }

  async feedback(req: any, id: string, dto: FeedbackDto): Promise<FeedbackResponseDto> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    let commentId: string | undefined;
    let reactionId: string | undefined;
    if (dto.content) {
      const comment = await this.prisma.communityComment.create({
        data: {
          journalId: id,
          userId,
          content: dto.content,
        },
      });
      commentId = comment.id;
      // 댓글 임베딩 및 Pinecone upsert (VectorDbService 래퍼)
      try {
        const embedding = await this.vectorDbService.getCombinedEmbedding([dto.content]);
        if (embedding) {
          await this.vectorDbService.upsert([
            {
              id: comment.id,
              values: embedding,
              metadata: {
                userId,
                type: 'feedback',
                journalId: id,
                createdAt: comment.createdAt?.toISOString?.() ?? new Date().toISOString(),
                visibility: diary.isPublic ? 'public' : 'private',
                modelVersion: 'gemini-embedding-001',
              },
            },
          ]);
        }
      } catch (e) {
        // 임베딩/업서트 실패 시 무시 (로깅 등 추가 가능)
      }
      // 피드백 루프: 유저 피드백 기록 (예: FeedbackLog 테이블, 통계/품질 개선 활용)
      try {
        await this.prisma.feedbackLog.create({
          data: {
            userId,
            journalId: id,
            commentId,
            content: dto.content,
            createdAt: new Date(),
          },
        });
      } catch (e) {}
    }
    if (dto.reactionType) {
      const reaction = await this.prisma.journalReaction.create({
        data: {
          journalId: id,
          userId,
          reactionType: dto.reactionType,
        },
      });
      reactionId = reaction.id;
    }
    return {
      success: true,
      message: '피드백 등록 완료',
      commentId,
      reactionId,
    };
  }

  async createDiary(req: any, dto: any) {
    // 질문 추천(공개 일기) 생성
    const userId = req.user.userId;
    const created = await this.prisma.journal.create({
      data: {
        content: dto.content,
        isPublic: true,
        userId,
        emotionScore: 0,
        writingDuration: dto.writingDuration || 1,
      },
    });
    // 질문 텍스트 저장 (journalQuestion)
    if (dto.question) {
      await this.prisma.journalQuestion.create({
        data: {
          journalId: created.id,
          question: dto.question,
        },
      });
    }
    return { id: created.id };
  }

  async getDiary(req: any, id: string) {
    // 단일 질문 추천(공개 일기) 조회
    const diary = await this.prisma.journal.findUnique({
      where: { id },
      include: { user: true, communityComments: true, reactions: true },
    });
    if (!diary || !diary.isPublic) throw new NotFoundException('질문을 찾을 수 없습니다.');
    const question = await this.prisma.journalQuestion.findFirst({ where: { journalId: id } });
    return {
      id: diary.id,
      content: diary.content,
      createdAt: diary.createdAt,
      isPublic: diary.isPublic,
      emotionScore: diary.emotionScore,
      mediaUrl: diary.mediaUrl,
      mediaType: diary.mediaType,
      question: question?.question || '',
      user: diary.user ? {
        id: diary.user.id,
        username: diary.user.username,
        mbti: diary.user.mbti ?? '',
        profileImageUrl: diary.user.profileImageUrl || undefined,
      } : { id: '', username: '', mbti: '', profileImageUrl: undefined },
      reactionCounts: {
        like: diary.reactions?.filter(r => r.reactionType === 'like').length ?? 0,
        hug: diary.reactions?.filter(r => r.reactionType === 'hug').length ?? 0,
        support: diary.reactions?.filter(r => r.reactionType === 'support').length ?? 0,
      },
      commentCount: diary.communityComments?.length ?? 0,
      lat: diary.lat,
      lng: diary.lng,
    };
  }

  async updateDiary(req: any, id: string, dto: any) {
    // 질문 추천(공개 일기) 수정
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary || !diary.isPublic) throw new NotFoundException('질문을 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('수정 권한이 없습니다.');
    await this.prisma.journal.update({
      where: { id },
      data: { content: dto.content },
    });
    if (dto.question) {
      await this.prisma.journalQuestion.upsert({
        where: { journalId: id },
        update: { question: dto.question },
        create: { journalId: id, question: dto.question },
      });
    }
    return { success: true };
  }

  async deleteDiary(req: any, id: string) {
    // 질문 추천(공개 일기) 삭제
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary || !diary.isPublic) throw new NotFoundException('질문을 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('삭제 권한이 없습니다.');
    // 관련된 feedback 벡터(댓글)와 일기 벡터 삭제 (feedback은 journalId filter 기반이므로 별도 관리 필요 - 여기서는 일기 id만 제거)
    try { await this.vectorDbService.delete([id]); } catch (e) {}
    await this.prisma.journal.delete({ where: { id } });
    return { success: true };
  }
}

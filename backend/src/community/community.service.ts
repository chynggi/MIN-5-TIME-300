import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommunityDiaryListResponseDto } from './dto/community-diary.dto';
import { FeedbackDto, FeedbackResponseDto } from './dto/feedback.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

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
}

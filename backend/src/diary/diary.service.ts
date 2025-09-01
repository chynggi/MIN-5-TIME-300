import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { generateDailyQuestion } from '../question/gemini-question.service';
import type { Multer } from 'multer';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { RateDiaryDto } from './dto/rate-diary.dto';
import { DiaryListResponseDto, DiaryDetailResponseDto } from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';
import { PrismaService } from '../prisma.service';
import { VectorDbService } from '../vector-db/vector-db.service';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDbService: VectorDbService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * 오늘 날짜에 작성된 '맞팔(서로 팔로우)' 친구들의 일기 목록을 반환
   * - 서로 팔로우 관계: follow (A->B, B->A 모두 ACTIVE, deletedAt null)
   * - 오늘 범위: 로컬(서버) 기준 자정~자정. (UTC 기준으로 처리 시 timezone 고려 필요)
   *   여기서는 서버 시간대 사용. 00:00 ~ 23:59:59.999
   * - 공개 범위: 친구가 일기를 isPublic=true 로 공개한 경우만 노출 (혹은 향후 friends-only 정책 추가 시 수정)
   * 반환 항목: diaryId, userId, username, profileImageUrl, emotion, createdAt
   */
  async getFriendsTodayDiaries(req: any) {
    const userId = req.user.userId;

    // 오늘 시작/끝 시간 계산
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1) 내가 팔로우하는 ACTIVE followee 목록
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: 'ACTIVE', deletedAt: null },
      select: { followeeId: true }
    });
    if (!following.length) return { items: [] };
    const followingIds = following.map(f => f.followeeId);

    // 2) 나를 팔로우하는 ACTIVE follower 중에서 상호관계 (맞팔)만 추출
    const followers = await this.prisma.follow.findMany({
      where: { followeeId: userId, status: 'ACTIVE', deletedAt: null, followerId: { in: followingIds } },
      select: { followerId: true }
    });
    const mutualIds = followers.map(f => f.followerId);
    if (!mutualIds.length) return { items: [] };

    // 3) 오늘 작성된 공개 일기 조회 (isPublic=true)
    const diaries = await this.prisma.journal.findMany({
      where: {
        userId: { in: mutualIds },
        isPublic: true,
        diaryDate: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, profileImageUrl: true } }
      }
    });

    const items = diaries.map(d => ({
      diaryId: d.id,
      userId: d.user.id,
      username: d.user.username,
      profileImageUrl: d.user.profileImageUrl,
      emotion: d.emotion ?? null,
      createdAt: d.createdAt.toISOString(),
    }));

    return { items };
  }

  async getTodayQuestion(req: any): Promise<TodayQuestionResponseDto> {
    // 동적 Gemini 질문 생성
    const userId = req.user.userId;
    // 1. 사용자(User) 및 페르소나(UserPersona) 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        persona: true,
        interests: true,
        lifestyleAnswers: true,
      },
    });
    // 2. 최근 일기 3개 조회 및 RecentJournal 타입 변환
    const recentJournalsRaw = await this.prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { question: true },
    });
    const recentJournals = recentJournalsRaw.map(j => ({
      id: j.id,
      content: j.content,
      date: j.createdAt.toISOString(),
      question: j.question?.question ?? '',
      emotionScore: j.emotionScore,
    }));
    // 3. 메타 정보 (MetaInfo 타입에 맞게 모든 필드 포함)
    const metaInfo = {
      dayOfWeek: new Date().getDay().toString(),
      timeOfDay: 'morning', // 실제 시간대 로직 필요시 변경
      reactionStats: {
        mostReactedQuestionTypes: [],
        leastReactedQuestionTypes: [],
      },
    };
    // 4. 페르소나/목표 정보 (UserPersona)
    const personaAndGoals = {
      persona: user?.persona?.persona ?? '',
      goals: user?.persona?.goals ? JSON.parse(user.persona.goals) : [],
    };
    // 5. userProfile: UserProfile 타입에 맞게 변환 (null 체크)
    if (!user) throw new NotFoundException('사용자 정보를 찾을 수 없습니다.');
    const userProfile = {
      ...user,
      mbti: user.mbti ?? '',
      interests: (user.interests ?? []).map(i => i.interest),
      lifestyleAnswers: user.lifestyleAnswers ?? [],
    };
    try {
      const question = await generateDailyQuestion(
        userProfile,
        recentJournals,
        metaInfo,
        userId,
        this.vectorDbService,
        personaAndGoals
      );
      return {
        question,
        questionId: '', // Gemini 질문에는 id가 없으므로 필요시 생성
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new NotFoundException('오늘의 질문을 생성하지 못했습니다.');
    }
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
        diaryDate: d.diaryDate.toISOString(), // 일기 날짜 포함
        isRetrospective: (d as any).isRetrospective ?? undefined,
        isPublic: d.isPublic,
        emotionScore: d.emotionScore,
        emotion: d.emotion ?? undefined, // 감정 이모지 포함
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
    const diary = await this.prisma.journal.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            showDiariesToPublic: true,
            showDiariesToFriends: true,
          }
        }
      }
    });
    
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    
    // 본인 일기가 아닌 경우 접근 권한 확인
    if (diary.userId !== userId) {
      // 개별 일기가 공개되어 있지 않으면 접근 불가
      if (!diary.isPublic) {
        throw new ForbiddenException('이 일기에 접근할 권한이 없습니다.');
      }
      
      // 개별 일기가 공개되어 있으면 접근 허용
      // (사용자가 개별적으로 공개한 일기는 볼 수 있어야 함)
    }
    
    return {
      id: diary.id,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
      diaryDate: diary.diaryDate.toISOString(), // 일기 날짜 포함
  isRetrospective: (diary as any).isRetrospective ?? undefined,
      isPublic: diary.isPublic,
      emotionScore: diary.emotionScore,
      emotion: diary.emotion ?? undefined, // 감정 이모지 포함
      mediaUrl: diary.mediaUrl ?? undefined,
      mediaType: diary.mediaType ?? undefined,
      question: '', // 추후 질문 연동
      writingDuration: diary.writingDuration,
      reactions: [], // 추후 구현
      userId: diary.userId, // 소유자 ID 추가
      user: {
        id: diary.user.id,
        username: diary.user.username,
      },
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
    // 파일이 있으면 저장 (공통 파일 업로드 서비스 사용)
    if (file) {
      try {
        const config = this.fileUploadService.getUploadConfig('diary');
        const uploadResult = await this.fileUploadService.uploadFile(
          file,
          config.uploadPath,
          config.allowedTypes,
          config.maxSize
        );
        
        mediaUrl = uploadResult.fileUrl;
        mediaType = file.mimetype;
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
      }
    }
    
    // FormData로 전달된 문자열 값들을 올바른 타입으로 변환
    const isPublic = (dto.isPublic as any) === true || (dto.isPublic as any) === 'true';
    // writingDuration은 DTO에서 문자열(@IsNumberString)로 들어오므로 확실하게 number로 파싱
    const writingDurationParsed = (() => {
      const n = parseInt(dto.writingDuration as any, 10);
      if (Number.isNaN(n) || n < 0) return 0; // 방어적 기본값
      return n;
    })();
    
    // diaryDate 처리 - 전달되면 사용, 없으면 현재 시각
    const diaryDate = dto.diaryDate ? new Date(dto.diaryDate) : new Date();
    
    // createdAt도 과거 회고 작성 시 diaryDate로 고정 (미래는 이미 필터됨)
    // Prisma에서는 createdAt default(now()) 대신 명시적으로 넣을 수 있음
    const nowMid = new Date();
    const todayMid = new Date(nowMid.getFullYear(), nowMid.getMonth(), nowMid.getDate());
    const useCustomCreatedAt = diaryDate <= todayMid; // 과거/오늘만 허용

    const diary = await this.prisma.journal.create({
      data: {
        userId,
        content: dto.content,
        isPublic,
        emotion: dto.emotion, // 감정 이모지 저장
        diaryDate, // 일기 날짜 저장
        ...(useCustomCreatedAt ? { createdAt: diaryDate } : {}),
        mediaUrl,
        mediaType,
  writingDuration: writingDurationParsed,
        emotionScore: 0,
      },
    });

    // 일기 저장 후 임베딩 생성 및 Pinecone upsert (VectorDbService 래퍼 사용)
    try {
      const embedding = await this.vectorDbService.getCombinedEmbedding([diary.content]);
      if (embedding) {
        // DB 저장 (prisma generate 후 embedding 필드 인식, 현재는 any 캐스팅 가능)
        (this.prisma as any).journal.update({ where: { id: diary.id }, data: { embedding } })
          .catch((err: any) => console.warn('임베딩 DB 저장 실패:', err.message));
        await this.vectorDbService.upsert([
          {
            id: diary.id,
            values: embedding,
            metadata: {
              userId,
              type: 'diary',
              createdAt: diary.createdAt.toISOString(),
              visibility: diary.isPublic ? 'public' : 'private',
              modelVersion: 'gemini-embedding-001',
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
    // Pinecone에서 유사 일기 검색 (type: 'diary') -> VectorDbService.query 사용
    const matches = await this.vectorDbService.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: { type: 'diary' },
    });
    // 일기 ID 추출 및 DB 조회
    const ids = (matches || []).map((m: any) => m.id);
    if (!ids.length) return [];
    const diaries = await this.prisma.journal.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'desc' },
    });
    // 결과 정렬: Pinecone 순서대로
    const idToDiary = Object.fromEntries(diaries.map(d => [d.id, d]));
    return ids.map((id: string) => idToDiary[id]).filter(Boolean);
  }

  // ==== 공개 일기 관리 메서드들 (Community2 통합) ====

  /**
   * 공개 일기 목록 조회
   */
  async getPublicDiaries(req: any, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { isPublic: true };
    
    // MBTI 필터링
    if (query.mbtiFilter) {
      where.user = { mbti: query.mbtiFilter };
    }
    
    // 정렬 기준
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

    return { diaries, totalCount, page, limit };
  }

  /**
   * 공개 일기 생성 (기존 일기를 공개로 변경하거나 새로 생성)
   */
  async createPublicDiary(req: any, dto: any) {
    const userId = req.user.userId;
    
    // 좌표 파싱
    const lat = typeof dto.lat === 'number' ? dto.lat : (dto.lat != null ? Number(dto.lat) : null);
    const lng = typeof dto.lng === 'number' ? dto.lng : (dto.lng != null ? Number(dto.lng) : null);
    
    const created = await this.prisma.journal.create({
      data: {
        content: dto.content,
        userId,
        isPublic: true,
        emotionScore: 0,
        writingDuration: dto.writingDuration || 1,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      },
    });
    
    return { id: created.id };
  }

  /**
   * 공개 일기 수정
   */
  async updatePublicDiary(req: any, id: string, dto: any) {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('수정 권한이 없습니다.');
    if (!diary.isPublic) throw new ForbiddenException('공개 일기만 수정할 수 있습니다.');
    
    // 좌표 파싱
    const lat = typeof dto.lat === 'number' ? dto.lat : (dto.lat != null ? Number(dto.lat) : undefined);
    const lng = typeof dto.lng === 'number' ? dto.lng : (dto.lng != null ? Number(dto.lng) : undefined);
    
    await this.prisma.journal.update({
      where: { id },
      data: {
        content: dto.content,
        ...(lat !== undefined ? { lat: Number.isFinite(lat) ? (lat as number) : null } : {}),
        ...(lng !== undefined ? { lng: Number.isFinite(lng) ? (lng as number) : null } : {}),
      },
    });
    
    return { success: true };
  }

  /**
   * 공개 일기 삭제
   */
  async deletePublicDiary(req: any, id: string) {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('삭제 권한이 없습니다.');
    if (!diary.isPublic) throw new ForbiddenException('공개 일기만 삭제할 수 있습니다.');
    // DB 삭제 전에 벡터 삭제 시도 (실패해도 진행)
    try { await this.vectorDbService.delete([id]); } catch (e) {}
    await this.prisma.journal.delete({ where: { id } });
    return { success: true };
  }
}

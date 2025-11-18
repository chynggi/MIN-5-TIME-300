import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { generateDailyQuestion } from '../question/gemini-question.service';
import type { Multer } from 'multer';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { ActivityService } from '../activity/activity.service';
import { RateDiaryDto } from './dto/rate-diary.dto';
import {
  DiaryListResponseDto,
  DiaryDetailResponseDto,
} from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';
import { PrismaService } from '../prisma.service';
import { VectorDbService } from '../vector-db/vector-db.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DiarySummaryService } from './summary.service';
import { AdviceService } from '../advice/advice.service';
import { StreakBadgeService } from '../activity/streak-badge.service';

// 간단한 제목 추출: [제목] 패턴 혹은 첫 줄 30자
function extractTitle(content: string): string | undefined {
  if (!content) return undefined;
  const titleMatch = content.match(/^\[제목\]\s*(.+)$/m);
  if (titleMatch) return titleMatch[1].trim().slice(0, 50);
  const firstLine = content.split(/\n/)[0].trim();
  if (firstLine) return firstLine.slice(0, 50);
  return undefined;
}

// 본문에서 제목 라인을 제거하여 저장용 텍스트를 반환한다
// 규칙:
// 1) [제목] 라인이 존재하면 그 라인을 제목으로 사용하고 제거
// 2) 없으면 첫 번째 비어있지 않은 라인을 제목으로 간주하고 제거
function splitTitleAndBody(content: string): { title?: string; body: string } {
  if (!content) return { body: '' };
  const lines = content.split(/\r?\n/);
  // 먼저 [제목] 라인 탐색 (어느 줄이든 허용하되 가장 먼저 등장하는 라인 사용)
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[제목\]\s*(.+)$/);
    if (m) {
      const title = m[1].trim().slice(0, 50);
      const rest = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n');
      // 본문 선행 공백/빈 줄 정리(필요 최소한)
      const body = rest.replace(/^\s*(\r?\n)+/, '');
      return { title, body };
    }
  }
  // [제목] 라인이 없으면 첫 번째 비어있지 않은 라인을 제목으로 사용
  const firstIdx = lines.findIndex((l) => l.trim().length > 0);
  if (firstIdx === -1) return { body: '' };
  const title = lines[firstIdx].trim().slice(0, 50);
  const rest = [...lines.slice(0, firstIdx), ...lines.slice(firstIdx + 1)].join(
    '\n',
  );
  const body = rest.replace(/^\s*(\r?\n)+/, '');
  return { title, body };
}

// 문자열/JSON/FormData 다양한 입력을 문자열 배열로 정규화
function normalizeStringArray(v: any): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return v
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function safeParseJson<T = any>(value?: unknown): T | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

const VALID_POST_VISIBILITY = new Set(['public', 'private', 'friends']);
const VALID_CONTENT_VISIBILITY = new Set(['public', 'private']);
const VALID_WEATHER = new Set([
  'sunny',
  'cloudy',
  'rainy',
  'snowy',
  'night',
  'rain',
  'snow',
]);

function resolvePostVisibility(
  raw: any,
  fallbackIsPublic?: boolean,
  current?: string,
): 'public' | 'private' | 'friends' {
  if (typeof raw === 'string' && VALID_POST_VISIBILITY.has(raw)) {
    return raw as 'public' | 'private' | 'friends';
  }
  if (current && VALID_POST_VISIBILITY.has(current)) {
    return current as 'public' | 'private' | 'friends';
  }
  if (fallbackIsPublic === true) return 'public';
  if (fallbackIsPublic === false) return 'private';
  return 'private';
}

function resolveContentVisibility(
  raw: any,
  postVisibility: 'public' | 'private' | 'friends',
  current?: string,
): 'public' | 'private' {
  if (postVisibility === 'private' || postVisibility === 'friends') {
    return 'private';
  }
  if (typeof raw === 'string' && VALID_CONTENT_VISIBILITY.has(raw)) {
    return raw as 'public' | 'private';
  }
  if (current && VALID_CONTENT_VISIBILITY.has(current)) {
    return current as 'public' | 'private';
  }
  return 'public';
}

function resolveWeather(raw: any, current?: string): string {
  if (typeof raw === 'string' && VALID_WEATHER.has(raw)) {
    return raw;
  }
  if (current && VALID_WEATHER.has(current)) {
    return current;
  }
  return 'sunny';
}

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorDbService: VectorDbService,
    private readonly fileUploadService: FileUploadService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly activityService: ActivityService,
    private readonly diarySummaryService: DiarySummaryService,
    private readonly adviceService: AdviceService,
    private readonly streakBadgeService: StreakBadgeService,
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
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // 1) 내가 팔로우하는 ACTIVE followee 목록
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: 'ACTIVE', deletedAt: null },
      select: { followeeId: true },
    });
    if (!following.length) return { items: [] };
    const followingIds = following.map((f) => f.followeeId);

    // 2) 나를 팔로우하는 ACTIVE follower 중에서 상호관계 (맞팔)만 추출
    const followers = await this.prisma.follow.findMany({
      where: {
        followeeId: userId,
        status: 'ACTIVE',
        deletedAt: null,
        followerId: { in: followingIds },
      },
      select: { followerId: true },
    });
    const mutualIds = followers.map((f) => f.followerId);
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
        user: { select: { id: true, username: true, profileImageUrl: true } },
      },
    });

    const items = diaries.map((d) => ({
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
    });
    const recentJournals = recentJournalsRaw.map((j) => ({
      id: j.id,
      content: j.content,
      date: j.createdAt.toISOString(),
      question: '', // deprecated: JournalQuestion 제거로 항상 빈 문자열
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
      interests: (user.interests ?? []).map((i) => i.interest),
      lifestyleAnswers: user.lifestyleAnswers ?? [],
    };
    try {
      const question = await generateDailyQuestion(
        userProfile,
        recentJournals,
        metaInfo,
        userId,
        this.vectorDbService,
        personaAndGoals,
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
    // 인기 정렬(popularity): 공개 일기 중 좋아요 상위 (전체 사용자 기준)
    if (query.sort === 'popularity' || query.sortBy === 'popularity') {
      // 공개 일기만 대상 - 자신의 것이든 아니든? 프론트 요구는 Top10 전체 공개 인기
      // 요청 사용자 구분 없이 공개 일기 전체.
      const publicWhere: any = { isPublic: true };
      // 기간 필터(선택적)
      if (query.startDate && query.endDate) {
        publicWhere.createdAt = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate),
        };
      }
      // 좋아요 수 집계 후 상위 limit
      const popular = await this.prisma.journal.findMany({
        where: publicWhere,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          diaryDate: true,
          isRetrospective: true as any,
          isPublic: true,
          postVisibility: true as any,
          contentVisibility: true as any,
          weather: true as any,
          emotionScore: true,
          emotion: true,
          mediaUrl: true,
          mediaType: true,
          lat: true as any,
          lng: true as any,
          user: { select: { username: true, profileImageUrl: true } },
          reactions: { select: { reactionType: true } },
        },
        orderBy: [{ reactions: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: limit,
        skip,
      });
      const totalCount = await this.prisma.journal.count({
        where: publicWhere,
      });
      return {
        diaries: popular.map((p) => ({
          id: p.id,
          title: (p as any).title ?? extractTitle(p.content) ?? undefined,
          content: p.content,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          diaryDate: p.diaryDate.toISOString(),
          isRetrospective: (p as any).isRetrospective ?? undefined,
          isPublic: p.isPublic,
          postVisibility:
            (p as any).postVisibility ?? (p.isPublic ? 'public' : 'private'),
          contentVisibility:
            (p as any).contentVisibility ??
            (['private', 'friends'].includes((p as any).postVisibility)
              ? 'private'
              : 'public'),
          weather: (p as any).weather ?? 'sunny',
          emotionScore: p.emotionScore,
          emotion: p.emotion ?? undefined,
          mediaUrl: p.mediaUrl ?? undefined,
          mediaType: p.mediaType ?? undefined,
          voiceUrl: (p as any).voiceUrl ?? undefined,
          voiceMime: (p as any).voiceMime ?? undefined,
          voiceDuration: (p as any).voiceDuration ?? undefined,
          music: (p as any).music ?? undefined,
          question: '', // deprecated
          lat: (p as any).lat,
          lng: (p as any).lng,
          likes:
            p.reactions?.filter((r) => r.reactionType === 'like').length || 0,
          username: p.user?.username,
          profileImageUrl: (p as any).user?.profileImageUrl || null,
        })),
        totalCount,
        page,
        limit,
      };
    }
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
      diaries: diaries.map((d) => ({
        id: d.id,
        title: (d as any).title ?? extractTitle(d.content) ?? undefined,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        diaryDate: d.diaryDate.toISOString(), // 일기 날짜 포함
        isRetrospective: (d as any).isRetrospective ?? undefined,
        isPublic: d.isPublic,
        postVisibility:
          (d as any).postVisibility ?? (d.isPublic ? 'public' : 'private'),
        contentVisibility:
          (d as any).contentVisibility ??
          (['private', 'friends'].includes((d as any).postVisibility)
            ? 'private'
            : 'public'),
        weather: (d as any).weather ?? 'sunny',
        emotionScore: d.emotionScore,
        emotion: d.emotion ?? undefined, // 감정 이모지 포함
        mediaUrl: d.mediaUrl ?? undefined,
        mediaType: d.mediaType ?? undefined,
        voiceUrl: (d as any).voiceUrl ?? undefined,
        voiceMime: (d as any).voiceMime ?? undefined,
        voiceDuration: (d as any).voiceDuration ?? undefined,
        music: (d as any).music ?? undefined,
        question: '', // deprecated
      })),
      totalCount,
      page,
      limit,
    };
  }

  /**
   * 공개 일기 전체(혹은 최근 N개) 조회
   * - 지도/커뮤니티 노출용: 최소 필드 + 위치(lat,lng) + 사용자 username
   * - 페이징 query.page, query.limit 지원 (기본 1, 100)
   * - 최신(updatedAt desc) 순
   */
  async getPublicDiaries(req: any, query: any) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 100, 200);
    const skip = (page - 1) * limit;
    const latestPerUser =
      query.latestPerUser === '1' || query.latestPerUser === 'true';
    const recentWindowMs = 24 * 60 * 60 * 1000; // 24시간 내 작성 일기만 노출
    const recentSince = new Date(Date.now() - recentWindowMs);

    // 공개 + 위치가 있는 일기만 우선 (위치 없는 것도 필요하면 조건 제거)
    const where: any = {
      isPublic: true,
      NOT: [{ lat: null }, { lng: null }],
      createdAt: { gte: recentSince },
    };

    if (latestPerUser) {
      // 사용자별 최신 공개 + 위치보유 일기 1개씩 (updatedAt desc)
      // 1) 위치 있는 공개 일기 전체 id/updatedAt/userId 조회 (상한)
      const candidates = await this.prisma.journal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 2000, // 안전 상한 (추후 cursor 전략 가능)
        select: { id: true, userId: true, updatedAt: true },
      });
      const pickedMap = new Map<string, { id: string; updatedAt: Date }>();
      for (const c of candidates) {
        if (!pickedMap.has(c.userId)) {
          pickedMap.set(c.userId, { id: c.id, updatedAt: c.updatedAt });
        }
      }
      const pickedIds = Array.from(pickedMap.values()).map((v) => v.id);
      if (!pickedIds.length) {
        return { diaries: [], totalCount: 0, page: 1, limit: pickedIds.length };
      }
      const rows = await this.prisma.journal.findMany({
        where: { id: { in: pickedIds } },
        // Prisma Client 재생성 전 profileColor 미존재 -> any 캐스팅 유지
        include: {
          user: {
            select: {
              username: true,
              profileImageUrl: true,
              /* @ts-ignore */ profileColor: true,
            },
          } as any,
        },
      });
      // updatedAt desc 정렬 유지
      rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return {
        diaries: rows.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          isPublic: r.isPublic,
          postVisibility:
            (r as any).postVisibility ?? (r.isPublic ? 'public' : 'private'),
          contentVisibility:
            (r as any).contentVisibility ??
            (['private', 'friends'].includes((r as any).postVisibility)
              ? 'private'
              : 'public'),
          weather: (r as any).weather ?? 'sunny',
          userId: r.userId,
          lat: (r as any).lat,
          lng: (r as any).lng,
          username: (r as any).user?.username,
          profileImageUrl: (r as any).user?.profileImageUrl || null,
          profileColor: (r as any).user?.profileColor || null,
          voiceUrl: (r as any).voiceUrl ?? undefined,
          voiceMime: (r as any).voiceMime ?? undefined,
          voiceDuration: (r as any).voiceDuration ?? undefined,
          music: (r as any).music ?? undefined,
        })),
        totalCount: rows.length,
        page: 1,
        limit: rows.length,
      };
    }

    const [rows, totalCount] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
          postVisibility: true as any,
          contentVisibility: true as any,
          weather: true as any,
          lat: true as any,
          lng: true as any,
          userId: true,
          user: {
            select: {
              username: true,
              profileImageUrl: true,
              /* @ts-ignore */ profileColor: true,
            },
          } as any,
        },
      }),
      this.prisma.journal.count({ where }),
    ]);

    return {
      diaries: rows.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        isPublic: r.isPublic,
        postVisibility:
          (r as any).postVisibility ?? (r.isPublic ? 'public' : 'private'),
        contentVisibility:
          (r as any).contentVisibility ??
          (['private', 'friends'].includes((r as any).postVisibility)
            ? 'private'
            : 'public'),
        weather: (r as any).weather ?? 'sunny',
        userId: r.userId,
        lat: (r as any).lat,
        lng: (r as any).lng,
        username: (r as any).user?.username,
        profileImageUrl: (r as any).user?.profileImageUrl || null,
        profileColor: (r as any).user?.profileColor || null,
        voiceUrl: (r as any).voiceUrl ?? undefined,
        voiceMime: (r as any).voiceMime ?? undefined,
        voiceDuration: (r as any).voiceDuration ?? undefined,
        music: (r as any).music ?? undefined,
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
          },
        },
      },
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
      title: (diary as any).title ?? extractTitle(diary.content) ?? undefined,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      updatedAt: diary.updatedAt.toISOString(),
      diaryDate: diary.diaryDate.toISOString(), // 일기 날짜 포함
      isRetrospective: (diary as any).isRetrospective ?? undefined,
      isPublic: diary.isPublic,
      postVisibility:
        (diary as any).postVisibility ?? (diary.isPublic ? 'public' : 'private'),
      contentVisibility:
        (diary as any).contentVisibility ??
        (['private', 'friends'].includes((diary as any).postVisibility)
          ? 'private'
          : 'public'),
      weather: (diary as any).weather ?? 'sunny',
      emotionScore: diary.emotionScore,
      emotion: diary.emotion ?? undefined, // 감정 이모지 포함
      mediaUrl: diary.mediaUrl ?? undefined,
      mediaType: diary.mediaType ?? undefined,
      voiceUrl: (diary as any).voiceUrl ?? undefined,
      voiceMime: (diary as any).voiceMime ?? undefined,
      voiceDuration: (diary as any).voiceDuration ?? undefined,
      music: (diary as any).music ?? undefined,
      question: '', // 추후 질문 연동
      selectedQuestions:
        Array.isArray((diary as any).selectedQuestionTexts) &&
        Array.isArray((diary as any).selectedQuestionDomains)
          ? ((diary as any).selectedQuestionTexts as string[]).map(
              (text: string, i: number) => ({
                text,
                domain:
                  (diary as any).selectedQuestionDomains?.[i] ?? 'emotion',
                answer: (diary as any).selectedQuestionAnswers?.[i],
              }),
            )
          : undefined,
      writingDuration: diary.writingDuration,
      reactions: [], // TODO: 상세 reaction 조회 필요 시 확장
      userId: diary.userId, // 소유자 ID 추가
      user: {
        id: diary.user.id,
        username: diary.user.username,
      },
    };
  }

  /**
   * 좋아요 토글
   * - 이미 like 존재 시 삭제
   * - 없으면 생성
   */
  async toggleLike(req: any, id: string) {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');

    const existing = await this.prisma.journalReaction
      .findUnique({
        where: {
          journalId_userId_reactionType: {
            journalId: id,
            userId,
            reactionType: 'like',
          },
        } as any,
      })
      .catch(() => null);

    if (existing) {
      await this.prisma.journalReaction.delete({ where: { id: existing.id } });
      const likeCount = await this.prisma.journalReaction.count({
        where: { journalId: id, reactionType: 'like' },
      });
      return { liked: false, likeCount };
    }

    try {
      await this.prisma.journalReaction.create({
        data: { journalId: id, userId, reactionType: 'like' },
      });
    } catch (e) {
      // race condition 방지: unique 충돌 발생 시 재조회
    }
    // 신규 좋아요 성공 시 활동지수 증가
    this.activityService.addLikeScore(userId).catch((err) => {
      console.warn('활동지수 좋아요 가점 실패:', err.message);
    });
    const likeCount = await this.prisma.journalReaction.count({
      where: { journalId: id, reactionType: 'like' },
    });
    return { liked: true, likeCount };
  }

  /** 현재 좋아요 상태/카운트 조회 */
  async getLikeStatus(req: any, id: string) {
    const userId = req.user.userId;
    const [liked, likeCount] = await Promise.all([
      this.prisma.journalReaction
        .findFirst({ where: { journalId: id, userId, reactionType: 'like' } })
        .then((r) => !!r),
      this.prisma.journalReaction.count({
        where: { journalId: id, reactionType: 'like' },
      }),
    ]);
    return { liked, likeCount };
  }

  async createDiary(
    req: any,
    dto: CreateDiaryDto,
    files?: {
      file?: Multer.File[];
      voice?: Multer.File[];
    },
  ): Promise<{
    id: string;
    content: string;
    createdAt: string;
    isPublic: boolean;
    postVisibility: string;
    contentVisibility: string;
    weather: string;
    question: string;
    mediaUrl?: string;
    mediaType?: string;
    lat?: number | null;
    lng?: number | null;
  }> {
    const userId = req.user.userId;
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;
    let voiceUrl: string | undefined;
    let voiceMime: string | undefined;
    let voiceDuration: number | undefined;

    const imageFileCandidate = files?.file?.[0];
    const voiceFileCandidate = files?.voice?.[0];
    let imageFile = imageFileCandidate;
    let voiceFile = voiceFileCandidate;

    if (!voiceFile && imageFile?.mimetype?.startsWith('audio/')) {
      voiceFile = imageFile;
      imageFile = undefined;
    }

    if (imageFile) {
      try {
        const config = this.fileUploadService.getUploadConfig('diary');
        const uploadResult = await this.fileUploadService.uploadFile(
          imageFile,
          config.uploadPath,
          config.allowedTypes,
          config.maxSize,
        );

        mediaUrl = uploadResult.fileUrl;
        mediaType = imageFile.mimetype;
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
      }
    } else if (dto.preset) {
      // 프리셋 키 기반 기본 이미지 경로 매핑
      const presetMap: Record<string, string> = {
        spring: '/images/seasons/spring.jpg',
        summer: '/images/seasons/summer.jpg',
        autumn: '/images/seasons/autumn.jpg',
        winter: '/images/seasons/winter.jpg',
        sunny: '/images/weather/sunny.jpg',
        night: '/images/weather/night.jpg',
        rain: '/images/weather/rain.jpg',
        snow: '/images/weather/snow.jpg',
      };
      const candidate = presetMap[dto.preset];
      if (candidate) {
        mediaUrl = candidate;
        mediaType = 'image/jpeg';
      }
    }

    if (voiceFile) {
      try {
        const config = this.fileUploadService.getUploadConfig('diary');
        const uploadResult = await this.fileUploadService.uploadFile(
          voiceFile,
          config.uploadPath,
          config.allowedTypes,
          config.maxSize,
        );
        voiceUrl = uploadResult.fileUrl;
        voiceMime = voiceFile.mimetype;
        const parsedDuration = parseInt(dto.voiceDuration as any, 10);
        if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
          voiceDuration = parsedDuration;
        }
      } catch (error) {
        console.error('음성 업로드 오류:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('음성 파일 업로드 중 오류가 발생했습니다.');
      }
    }

    const musicPayload = safeParseJson(dto.music);

    // FormData로 전달된 문자열 값들을 올바른 타입으로 변환
    const legacyIsPublicTrue =
      (dto.isPublic as any) === true || (dto.isPublic as any) === 'true';
    const legacyIsPublicFalse =
      (dto.isPublic as any) === false || (dto.isPublic as any) === 'false';
    const legacyIsPublicValue = legacyIsPublicTrue
      ? true
      : legacyIsPublicFalse
        ? false
        : undefined;
    // writingDuration은 DTO에서 문자열(@IsNumberString)로 들어오므로 확실하게 number로 파싱
    const writingDurationParsed = (() => {
      const n = parseInt(dto.writingDuration as any, 10);
      if (Number.isNaN(n) || n < 0) return 0; // 방어적 기본값
      return n;
    })();

    // diaryDate 처리 - 전달되면 사용, 없으면 현재 시각
    const diaryDate = dto.diaryDate ? new Date(dto.diaryDate) : new Date();
    const dayStart = new Date(
      diaryDate.getFullYear(),
      diaryDate.getMonth(),
      diaryDate.getDate(),
    );

    // createdAt도 과거 회고 작성 시 diaryDate로 고정 (미래는 이미 필터됨)
    // Prisma에서는 createdAt default(now()) 대신 명시적으로 넣을 수 있음
    const nowMid = new Date();
    const todayMid = new Date(
      nowMid.getFullYear(),
      nowMid.getMonth(),
      nowMid.getDate(),
    );
    const useCustomCreatedAt = diaryDate <= todayMid; // 과거/오늘만 허용

    // 위도/경도 문자열을 Float로 변환 (유효하지 않으면 undefined => Prisma null 저장)
    const lat =
      dto.lat !== undefined && dto.lat !== null && dto.lat !== ''
        ? parseFloat(dto.lat)
        : undefined;
    const lng =
      dto.lng !== undefined && dto.lng !== null && dto.lng !== ''
        ? parseFloat(dto.lng)
        : undefined;

    // finalize=true일 때 최종 요약 실행, 그 외에는 원문 저장
    let finalContent = dto.content;
    const isFinalize =
      (dto as any).finalize === 'true' || (dto as any).finalize === true;
    let summaryMeta: {
      modelUsed: string;
      truncated: boolean;
      fallbackUsed: boolean;
    } | null = null;
    if (isFinalize) {
      try {
        const sum = await this.diarySummaryService.summarize(finalContent, {
          title: extractTitle(finalContent),
          modelId: dto.questionModel,
          userId,
        });
        finalContent = sum.text;
        summaryMeta = {
          modelUsed: sum.modelUsed,
          truncated: sum.truncated,
          fallbackUsed: sum.fallbackUsed,
        };
      } catch (e) {
        // 요약 실패 시 원문 유지
      }
    }
    // 제목 저장: 프론트가 별도 title을 보낼 수 없으므로 [제목] 패턴/첫 줄에서 추출
    const { title: resolvedTitle, body: cleanedContent } =
      splitTitleAndBody(finalContent);
    const selectedQuestionDomains = normalizeStringArray(
      (dto as any).selectedQuestionDomains,
    );
    const selectedQuestionTexts = normalizeStringArray(
      (dto as any).selectedQuestionTexts,
    );
    const selectedQuestionAnswers = normalizeStringArray(
      (dto as any).selectedQuestionAnswers,
    );
    const postVisibility = resolvePostVisibility(
      (dto as any).postVisibility,
      legacyIsPublicValue,
    );
    const isPublic =
      legacyIsPublicValue !== undefined
        ? legacyIsPublicValue
        : postVisibility === 'public';
    const contentVisibility = resolveContentVisibility(
      (dto as any).contentVisibility,
      postVisibility,
    );
    const weather = resolveWeather((dto as any).weather);

    // 동일 날짜 일기 존재 시 업데이트로 전환
    let diary = await this.prisma.journal.findFirst({
      where: { userId, diaryDate: dayStart },
    });
    if (diary) {
      diary = await this.prisma.journal.update({
        where: { id: diary.id },
        data: {
          content: cleanedContent,
          isPublic,
          emotion: dto.emotion,
          postVisibility,
          contentVisibility,
          weather,
          // 날짜는 유지(dayStart)
          mediaUrl,
          mediaType,
          ...(voiceUrl !== undefined
            ? {
                voiceUrl,
                voiceMime,
                voiceDuration,
              }
            : {}),
          ...(musicPayload !== undefined ? { music: musicPayload } : {}),
          writingDuration: writingDurationParsed,
          lat,
          lng,
          title: resolvedTitle,
          // 선택 질문은 생성 시 또는 이후에도 업데이트 허용 (있을 때만 덮어쓰기)
          ...(selectedQuestionDomains ? { selectedQuestionDomains } : {}),
          ...(selectedQuestionTexts ? { selectedQuestionTexts } : {}),
          ...(selectedQuestionAnswers ? { selectedQuestionAnswers } : {}),
          // finalize=true인 경우에만 summary* 메타 저장
          ...(summaryMeta
            ? {
                summaryModel: summaryMeta.modelUsed,
                summaryTruncated: summaryMeta.truncated,
                summaryFallbackUsed: summaryMeta.fallbackUsed,
              }
            : {}),
        },
      });
    } else {
      diary = await this.prisma.journal.create({
        data: {
          userId,
          content: cleanedContent,
          isPublic,
          emotion: dto.emotion, // 감정 이모지 저장
          postVisibility,
          contentVisibility,
          weather,
          diaryDate: dayStart, // 일기 날짜는 정규화된 00:00:00으로 저장
          ...(useCustomCreatedAt ? { createdAt: dayStart } : {}),
          mediaUrl,
          mediaType,
          ...(voiceUrl !== undefined
            ? {
                voiceUrl,
                voiceMime,
                voiceDuration,
              }
            : {}),
          ...(musicPayload !== undefined ? { music: musicPayload } : {}),
          writingDuration: writingDurationParsed,
          emotionScore: 0,
          lat,
          lng,
          title: resolvedTitle,
          selectedQuestionDomains: selectedQuestionDomains ?? [],
          selectedQuestionTexts: selectedQuestionTexts ?? [],
          selectedQuestionAnswers: selectedQuestionAnswers ?? [],
          ...(summaryMeta
            ? {
                summaryModel: summaryMeta.modelUsed,
                summaryTruncated: summaryMeta.truncated,
                summaryFallbackUsed: summaryMeta.fallbackUsed,
              }
            : {}),
        },
      });
    }

    // 일기 저장/업데이트 후 임베딩 생성 및 Pinecone upsert (VectorDbService 래퍼 사용)
    try {
      const embedding = await this.vectorDbService.getCombinedEmbedding([
        diary.content,
      ]);
      if (embedding) {
        // DB 저장 (prisma generate 후 embedding 필드 인식, 현재는 any 캐스팅 가능)
        (this.prisma as any).journal
          .update({ where: { id: diary.id }, data: { embedding } })
          .catch((err: any) =>
            console.warn('임베딩 DB 저장 실패:', err.message),
          );
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

    const result = {
      id: diary.id,
      title: (diary as any).title ?? resolvedTitle ?? undefined,
      content: diary.content,
      createdAt: diary.createdAt.toISOString(),
      isPublic: diary.isPublic,
      postVisibility: (diary as any).postVisibility ?? postVisibility,
      contentVisibility:
        (diary as any).contentVisibility ?? contentVisibility,
      weather: (diary as any).weather ?? weather,
      question: '', // deprecated
      mediaUrl,
      mediaType,
      voiceUrl: voiceUrl ?? (diary as any).voiceUrl ?? undefined,
      voiceMime: voiceMime ?? (diary as any).voiceMime ?? undefined,
      voiceDuration:
        voiceDuration ?? (diary as any).voiceDuration ?? undefined,
      music: musicPayload ?? (diary as any).music ?? undefined,
      lat: (diary as any).lat ?? null,
      lng: (diary as any).lng ?? null,
    };

    // 스트릭/배지 업데이트
    this.streakBadgeService.onDiaryOrCheckin(userId, diaryDate).catch(() => {});

    // 일기 작성 후 최신 일기 수 카운트 및 실시간 전송 (비동기, 실패해도 throw 아님)
    this.prisma.journal
      .count({ where: { userId } })
      .then((count) => {
        this.realtimeGateway.emitProfileCountersUpdate({
          userId,
          diaryCount: count,
        });
      })
      .catch((err) => {
        console.error('실시간 diaryCount 전송 실패', err.message);
      });

    // 활동지수 반영 (질문 사용 여부: dto.questionId 존재 시 질문 기반 작성으로 간주)
    this.activityService
      .addDiaryScore(userId, !!dto.questionId)
      .catch((err) => {
        console.warn('활동지수 일기 가점 실패:', err.message);
      });

    // 일기 저장 직후 오늘의 한마디 갱신 시도 (비동기, 오류는 무시)
    this.adviceService.generateWithCache(userId, true).catch((err) => {
      console.warn('조언 갱신 실패 (무시):', err.message);
    });

    return result;
  }

  /**
   * 질문 답변 저장: Q&A를 커밋하고 즉시 요약을 생성/저장한다.
   * - 기존 일기가 있으면 업데이트, 없으면 생성(최초 저장 시 선택 질문 텍스트/도메인도 저장)
   */
  async saveQuestionAnswers(
    req: any,
    dto: {
      qa: Array<{ domain: string; question: string; answer: string }>;
      modelId?: string;
      diaryDate?: string;
    },
  ) {
    const userId = req.user.userId;
    const date = dto.diaryDate ? new Date(dto.diaryDate) : new Date();
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    // 기존 일기 조회(해당 날짜)
    let journal = await this.prisma.journal.findFirst({
      where: { userId, diaryDate: dayStart },
    });

    // Q&A를 단일 텍스트로 병합 (요약 입력)
    const qaText = dto.qa
      .map((q, i) => `[${q.domain}] Q${i + 1}: ${q.question}\nA: ${q.answer}`)
      .join('\n\n');
    const title = extractTitle(qaText) || '오늘의 Q&A';

    // 즉시 요약 생성
    const sum = await this.diarySummaryService.summarize(qaText, {
      title,
      modelId: dto.modelId,
      userId,
    });
    const finalContent = sum.text;

    if (!journal) {
      // 최초 생성: 선택 질문 저장
      journal = await this.prisma.journal.create({
        data: {
          userId,
          diaryDate: dayStart,
          content: finalContent,
          isPublic: false,
          writingDuration: 0,
          emotionScore: 0,
          summaryModel: sum.modelUsed,
          summaryTruncated: sum.truncated,
          summaryFallbackUsed: sum.fallbackUsed,
          selectedQuestionDomains: dto.qa.map((q) => q.domain),
          selectedQuestionTexts: dto.qa.map((q) => q.question),
          selectedQuestionAnswers: dto.qa.map((q) => q.answer),
        },
      });
    } else {
      // 업데이트: 내용과 요약 메타만 갱신(질문 배열은 최초 생성 시에만 저장)
      journal = await this.prisma.journal.update({
        where: { id: journal.id },
        data: {
          content: finalContent,
          summaryModel: sum.modelUsed,
          summaryTruncated: sum.truncated,
          summaryFallbackUsed: sum.fallbackUsed,
          selectedQuestionDomains: dto.qa.map((q) => q.domain),
          selectedQuestionTexts: dto.qa.map((q) => q.question),
          selectedQuestionAnswers: dto.qa.map((q) => q.answer),
        },
      });
    }

    // 활동지수 가점(질문 기반 작성)
    this.activityService.addDiaryScore(userId, true).catch(() => {});

    // 조언 갱신 트리거
    this.adviceService.generateWithCache(userId, true).catch(() => {});

    return {
      id: journal.id,
      content: journal.content,
      createdAt: journal.createdAt.toISOString(),
      isPublic: journal.isPublic,
      postVisibility:
        (journal as any).postVisibility ?? (journal.isPublic ? 'public' : 'private'),
      contentVisibility:
        (journal as any).contentVisibility ??
        ((journal as any).postVisibility === 'private' ? 'private' : 'public'),
      weather: (journal as any).weather ?? 'sunny',
      question: '',
      diaryDate: journal.diaryDate.toISOString(),
      summary: {
        modelUsed: sum.modelUsed,
        truncated: sum.truncated,
        fallbackUsed: sum.fallbackUsed,
      },
      selectedQuestions:
        journal.selectedQuestionTexts?.map((t, i) => ({
          domain: journal.selectedQuestionDomains?.[i],
          text: t,
          answer: journal.selectedQuestionAnswers?.[i],
        })) || [],
    };
  }

  async rateDiary(
    req: any,
    id: string,
    dto: RateDiaryDto,
  ): Promise<{ id: string; emotionScore: number; updatedAt: string }> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId)
      throw new ForbiddenException('본인 일기만 평가할 수 있습니다.');
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

  async shareDiary(
    req: any,
    id: string,
    isPublic: boolean,
  ): Promise<{ id: string; isPublic: boolean; updatedAt: string }> {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId)
      throw new ForbiddenException('본인 일기만 공유 설정할 수 있습니다.');
    const updated = await this.prisma.journal.update({
      where: { id },
      data: {
        isPublic,
        postVisibility: isPublic ? 'public' : 'private',
      },
    });
    return {
      id: updated.id,
      isPublic: updated.isPublic,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteDiary(req: any, id: string) {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId)
      throw new ForbiddenException('본인 일기만 삭제할 수 있습니다.');

    await this.prisma.$transaction(async (tx) => {
      await tx.journalReaction.deleteMany({ where: { journalId: id } });
      await tx.journal.delete({ where: { id } });
    });

    if (diary.mediaUrl && diary.mediaUrl.startsWith('/uploads/')) {
      await this.fileUploadService.deleteFile(diary.mediaUrl);
    }
    if (diary.voiceUrl && diary.voiceUrl.startsWith('/uploads/')) {
      await this.fileUploadService.deleteFile(diary.voiceUrl);
    }

    this.vectorDbService.delete([id]).catch((err) => {
      console.warn('일기 삭제 후 벡터 삭제 실패:', err?.message || err);
    });

    this.prisma.journal
      .count({ where: { userId } })
      .then((count) => {
        this.realtimeGateway.emitProfileCountersUpdate({
          userId,
          diaryCount: count,
        });
      })
      .catch((err) => {
        console.warn('일기 삭제 후 실시간 카운터 전송 실패:', err?.message);
      });

    return { id, deleted: true };
  }

  /**
   * 일기 수정: 생성 로직과 동일한 업로드/프리셋 매핑을 재사용하고, Q&A 흔적이 있거나 questionModel이 있으면 재요약 반영
   */
  async updateDiary(
    req: any,
    id: string,
    dto: CreateDiaryDto,
    files?: {
      file?: Multer.File[];
      voice?: Multer.File[];
    },
  ) {
    const userId = req.user.userId;
    const diary = await this.prisma.journal.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('일기를 찾을 수 없습니다.');
    if (diary.userId !== userId)
      throw new ForbiddenException('본인 일기만 수정할 수 있습니다.');

    // 파일 업로드 처리 (선택)
    let mediaUrl: string | undefined = diary.mediaUrl ?? undefined;
    let mediaType: string | undefined = diary.mediaType ?? undefined;
    let voiceFileToDelete: string | undefined;
    let voicePatch:
      | {
          voiceUrl: string | null;
          voiceMime: string | null;
          voiceDuration: number | null;
        }
      | undefined;

    let imageFile = files?.file?.[0];
    let voiceFile = files?.voice?.[0];
    if (!voiceFile && imageFile?.mimetype?.startsWith('audio/')) {
      voiceFile = imageFile;
      imageFile = undefined;
    }

    if (imageFile) {
      try {
        const config = this.fileUploadService.getUploadConfig('diary');
        const uploadResult = await this.fileUploadService.uploadFile(
          imageFile,
          config.uploadPath,
          config.allowedTypes,
          config.maxSize,
        );
        mediaUrl = uploadResult.fileUrl;
        mediaType = imageFile.mimetype;
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
      }
    } else if (dto.preset) {
      const presetMap: Record<string, string> = {
        spring: '/images/seasons/spring.jpg',
        summer: '/images/seasons/summer.jpg',
        autumn: '/images/seasons/autumn.jpg',
        winter: '/images/seasons/winter.jpg',
        sunny: '/images/weather/sunny.jpg',
        night: '/images/weather/night.jpg',
        rain: '/images/weather/rain.jpg',
        snow: '/images/weather/snow.jpg',
      };
      const candidate = presetMap[dto.preset];
      if (candidate) {
        mediaUrl = candidate;
        mediaType = 'image/jpeg';
      }
    }

    const shouldRemoveVoice =
      (dto as any).removeVoice === 'true' || (dto as any).removeVoice === true;
    if (voiceFile) {
      try {
        const config = this.fileUploadService.getUploadConfig('diary');
        const uploadResult = await this.fileUploadService.uploadFile(
          voiceFile,
          config.uploadPath,
          config.allowedTypes,
          config.maxSize,
        );
        const parsedDuration = parseInt(dto.voiceDuration as any, 10);
        voicePatch = {
          voiceUrl: uploadResult.fileUrl,
          voiceMime: voiceFile.mimetype,
          voiceDuration: Number.isNaN(parsedDuration) ? null : parsedDuration,
        };
        if (diary.voiceUrl?.startsWith('/uploads/')) {
          voiceFileToDelete = diary.voiceUrl;
        }
      } catch (error) {
        console.error('음성 업로드 오류:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('음성 파일 업로드 중 오류가 발생했습니다.');
      }
    } else if (shouldRemoveVoice) {
      voicePatch = {
        voiceUrl: null,
        voiceMime: null,
        voiceDuration: null,
      };
      if (diary.voiceUrl?.startsWith('/uploads/')) {
        voiceFileToDelete = diary.voiceUrl;
      }
    }

    const musicPayload = safeParseJson(dto.music);
    const removeMusic =
      (dto as any).removeMusic === 'true' || (dto as any).removeMusic === true;
    const musicPatch = removeMusic
      ? { music: null }
      : musicPayload !== undefined
        ? { music: musicPayload }
        : undefined;

    // 타입 변환
    const legacyIsPublicTrue =
      (dto.isPublic as any) === true || (dto.isPublic as any) === 'true';
    const legacyIsPublicFalse =
      (dto.isPublic as any) === false || (dto.isPublic as any) === 'false';
    const legacyIsPublicValue = legacyIsPublicTrue
      ? true
      : legacyIsPublicFalse
        ? false
        : undefined;
    const writingDurationParsed = (() => {
      const n = parseInt(dto.writingDuration as any, 10);
      if (Number.isNaN(n) || n < 0) return 0;
      return n;
    })();
    const lat =
      dto.lat !== undefined && dto.lat !== null && dto.lat !== ''
        ? parseFloat(dto.lat)
        : (diary as any).lat;
    const lng =
      dto.lng !== undefined && dto.lng !== null && dto.lng !== ''
        ? parseFloat(dto.lng)
        : (diary as any).lng;
    const postVisibility = resolvePostVisibility(
      (dto as any).postVisibility,
      legacyIsPublicValue,
      (diary as any).postVisibility,
    );
    const isPublic =
      legacyIsPublicValue !== undefined
        ? legacyIsPublicValue
        : postVisibility === 'public';
    const contentVisibility = resolveContentVisibility(
      (dto as any).contentVisibility,
      postVisibility,
      (diary as any).contentVisibility,
    );
    const weather = resolveWeather((dto as any).weather, (diary as any).weather);

    // finalize=true일 때만 요약 적용
    let finalContent = dto.content;
    const isFinalize =
      (dto as any).finalize === 'true' || (dto as any).finalize === true;
    let summaryMeta: {
      modelUsed: string;
      truncated: boolean;
      fallbackUsed: boolean;
    } | null = null;
    if (isFinalize) {
      try {
        const sum = await this.diarySummaryService.summarize(finalContent, {
          title: extractTitle(finalContent),
          modelId: dto.questionModel,
          userId,
        });
        finalContent = sum.text;
        summaryMeta = {
          modelUsed: sum.modelUsed,
          truncated: sum.truncated,
          fallbackUsed: sum.fallbackUsed,
        };
      } catch {}
    }

    const { title: resolvedTitle, body: cleanedContent } =
      splitTitleAndBody(finalContent);

    const updated = await this.prisma.journal.update({
      where: { id },
      data: {
        content: cleanedContent,
        isPublic,
        postVisibility,
        contentVisibility,
        weather,
        emotion: dto.emotion,
        mediaUrl,
        mediaType,
        ...(voicePatch ?? {}),
        ...(musicPatch ?? {}),
        writingDuration: writingDurationParsed,
        lat,
        lng,
        title: resolvedTitle,
        // 선택 질문 업데이트 허용
        ...(() => {
          const d = normalizeStringArray((dto as any).selectedQuestionDomains);
          const t = normalizeStringArray((dto as any).selectedQuestionTexts);
          const a = normalizeStringArray((dto as any).selectedQuestionAnswers);
          return {
            ...(d ? { selectedQuestionDomains: d } : {}),
            ...(t ? { selectedQuestionTexts: t } : {}),
            ...(a ? { selectedQuestionAnswers: a } : {}),
          };
        })(),
        // finalize=true인 경우에만 summary* 메타 갱신
        ...(summaryMeta
          ? {
              summaryModel: summaryMeta.modelUsed,
              summaryTruncated: summaryMeta.truncated,
              summaryFallbackUsed: summaryMeta.fallbackUsed,
            }
          : {}),
      },
    });

    if (voiceFileToDelete) {
      await this.fileUploadService.deleteFile(voiceFileToDelete).catch(() => {
        /* ignore */
      });
    }

    // 임베딩 갱신(베스트 에포치: 내용 변경 시)
    try {
      const embedding = await this.vectorDbService.getCombinedEmbedding([
        updated.content,
      ]);
      if (embedding) {
        (this.prisma as any).journal
          .update({ where: { id: updated.id }, data: { embedding } })
          .catch((err: any) =>
            console.warn('임베딩 DB 저장 실패:', err.message),
          );
        await this.vectorDbService.upsert([
          {
            id: updated.id,
            values: embedding,
            metadata: {
              userId,
              type: 'diary',
              createdAt: updated.createdAt.toISOString(),
              visibility: updated.isPublic ? 'public' : 'private',
              modelVersion: 'gemini-embedding-001',
            },
          },
        ]);
      }
    } catch {}

    return {
      id: updated.id,
      title: (updated as any).title ?? resolvedTitle ?? undefined,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      isPublic: updated.isPublic,
      postVisibility: (updated as any).postVisibility ?? postVisibility,
      contentVisibility:
        (updated as any).contentVisibility ?? contentVisibility,
      weather: (updated as any).weather ?? weather,
      question: '',
      mediaUrl,
      mediaType,
      voiceUrl: (updated as any).voiceUrl ?? voicePatch?.voiceUrl ?? undefined,
      voiceMime: (updated as any).voiceMime ?? voicePatch?.voiceMime ?? undefined,
      voiceDuration:
        (updated as any).voiceDuration ?? voicePatch?.voiceDuration ?? undefined,
      music:
        (musicPatch?.music !== undefined
          ? musicPatch.music
          : (updated as any).music) ?? undefined,
      lat: (updated as any).lat ?? null,
      lng: (updated as any).lng ?? null,
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
      const texts = recent.map((d) => d.content);
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
    const idToDiary = Object.fromEntries(diaries.map((d) => [d.id, d]));
    return ids.map((id: string) => idToDiary[id]).filter(Boolean);
  }
}

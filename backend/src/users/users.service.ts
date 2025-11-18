import { Injectable } from '@nestjs/common';
import {
  FollowStatus,
  LifestyleAnswer,
  UserInterest,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SearchUsersDto } from './dto/search-users.dto';
import { SearchUserResponseDto } from './dto/search-user-response.dto';

type LifestyleTimeBadge = 'sun' | 'moon' | 'question';
type SocialPersona = '집순이' | '집돌이' | '밖순이' | '밖돌이' | 'unknown';

const INTEREST_KEYWORDS: Record<
  string,
  { label: string; keywords: string[] }
> = {
  music: {
    label: '음악',
    keywords: ['음악', '노래', '콘서트', '뮤지', '플레이리스트', '버스킹'],
  },
  movies: {
    label: '영화/영상',
    keywords: ['영화', '영상', 'ott', '드라마', '예능', '시네', '다큐'],
  },
  art: {
    label: '예술/디자인',
    keywords: ['예술', '미술', '디자인', '전시', '사진', '드로잉', '아트', '공예'],
  },
  games: {
    label: '게임',
    keywords: ['게임', '콘솔', 'pc', '모바일', 'e스포츠', '보드게임', '레이싱'],
  },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(
    currentUserId: string,
    dto: SearchUsersDto,
  ): Promise<{ users: SearchUserResponseDto[] }> {
    const limitNum = Math.min(parseInt(dto.limit || '20', 10) || 20, 50);
    const query = dto.q?.trim() || '';
    const minAge = Math.max(parseInt(dto.minAge || '18', 10) || 18, 18);
    const maxAge = Math.min(parseInt(dto.maxAge || '100', 10) || 100, 100);
    const mbtiFilters = this.parseCsv(dto.mbti).map((mbti) => mbti.toUpperCase());
    const interestFilters = this.parseCsv(dto.interestTags).map((tag) =>
      tag.toLowerCase(),
    );
    const timeFilters = this.parseCsv(dto.timePref).map((time) =>
      time.toLowerCase() as LifestyleTimeBadge,
    );
    const socialFilters = this.parseCsv(dto.socialType);
    const inactiveDays = Math.max(
      parseInt(dto.inactiveDays || '30', 10) || 30,
      1,
    );
    const activityCutoff = new Date();
    activityCutoff.setDate(activityCutoff.getDate() - inactiveDays);

    const exclusionIds = await this.collectExcludedUserIds(currentUserId);
    const where: any = {
      isActive: true,
      ...(query
        ? {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : {}),
      AND: [
        {
          OR: [
            { journals: { some: { createdAt: { gte: activityCutoff } } } },
            { checkins: { some: { createdAt: { gte: activityCutoff } } } },
          ],
        },
      ],
    };

    if (exclusionIds.size > 0) {
      where.id = {
        notIn: Array.from(exclusionIds),
      };
    }

    const candidateLimit = Math.min(limitNum * 3, 90);
    const users = await this.prisma.user.findMany({
      where,
      take: candidateLimit,
      orderBy: [{ activityScore: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        username: true,
        mbti: true,
        profileImageUrl: true,
        birthDate: true,
        gender: true,
        activityScore: true,
        interests: {
          select: {
            interest: true,
          },
        },
        lifestyleAnswers: {
          select: {
            answer: true,
            question: true,
          },
        },
        journals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        checkins: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const filtered = users
      .map((user) => {
        const age = this.calculateAge(user.birthDate);
        if (age && (age < minAge || age > maxAge)) {
          return null;
        }

        const mbti = user.mbti?.toUpperCase();
        const mbtiMatches =
          mbtiFilters.length === 0 || (mbti ? mbtiFilters.includes(mbti) : false);
        if (!mbtiMatches) {
          return null;
        }

        const matchedInterests = this.matchInterestCategories(
          user.interests,
          interestFilters,
        );
        if (interestFilters.length > 0 && matchedInterests.length === 0) {
          return null;
        }

        const lifestyleTime = this.deriveTimePreference(user.lifestyleAnswers);
        const timeMatches =
          timeFilters.length === 0 || timeFilters.includes(lifestyleTime);
        if (!timeMatches) {
          return null;
        }

        const lifestyleSocial = this.deriveSocialPersona(
          user.lifestyleAnswers,
          user.gender,
        );
        const socialMatches =
          socialFilters.length === 0 || socialFilters.includes(lifestyleSocial);
        if (!socialMatches) {
          return null;
        }

        const lastDiaryAt = user.journals[0]?.createdAt;
        const lastCheckinAt = user.checkins[0]?.createdAt;
        const lastActiveAt = [lastDiaryAt, lastCheckinAt]
          .filter(Boolean)
          .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0] || null;

        let compatibilityScore = 0;
        if (mbtiFilters.length && mbtiMatches) compatibilityScore += 1;
        compatibilityScore += matchedInterests.length;
        if (timeFilters.length && timeMatches) compatibilityScore += 1;
        if (socialFilters.length && socialMatches) compatibilityScore += 1;

        const response: SearchUserResponseDto & { rawActiveAt: Date | null } = {
          id: user.id,
          username: user.username,
          mbti: user.mbti || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          isFollowing: false,
          isFriend: false,
          followStatus: 'none',
          age: age ?? null,
          lastActiveAt: lastActiveAt ? lastActiveAt.toISOString() : null,
          lifestyleTime,
          lifestyleSocial,
          matchedInterests,
          compatibilityScore,
          activityScore: user.activityScore ?? null,
          rawActiveAt: lastActiveAt,
        };

        return response;
      })
      .filter(Boolean)
      .map((user) => user as SearchUserResponseDto & { rawActiveAt: Date | null });

    const sorted = filtered
      .sort((a, b) => {
        if ((b.compatibilityScore || 0) !== (a.compatibilityScore || 0)) {
          return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
        }
        if ((b.activityScore || 0) !== (a.activityScore || 0)) {
          return (b.activityScore || 0) - (a.activityScore || 0);
        }
        const aActive = a.rawActiveAt ? a.rawActiveAt.getTime() : 0;
        const bActive = b.rawActiveAt ? b.rawActiveAt.getTime() : 0;
        return bActive - aActive;
      })
      .slice(0, limitNum)
      .map(({ rawActiveAt, ...rest }) => rest);

    return {
      users: sorted,
    };
  }

  private parseCsv(value?: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private calculateAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age -= 1;
    }
    return age;
  }

  private deriveTimePreference(
    answers: Pick<LifestyleAnswer, 'answer'>[],
  ): LifestyleTimeBadge {
    if (!answers?.length) return 'question';
    const hasMorning = answers.some((item) =>
      item.answer?.includes('아침형 인간이다'),
    );
    const hasNight = answers.some((item) =>
      item.answer?.includes('저녁형 인간이다'),
    );
    if (hasMorning && !hasNight) return 'sun';
    if (hasNight && !hasMorning) return 'moon';
    return 'question';
  }

  private deriveSocialPersona(
    answers: Pick<LifestyleAnswer, 'answer'>[],
    gender?: string | null,
  ): SocialPersona {
    const likesPeople = answers.some((item) =>
      item.answer?.includes('사람을 자주 만나는'),
    );
    const likesSolo = answers.some((item) =>
      item.answer?.includes('혼자 있는 시간을 좋아'),
    );

    const normalizedGender = (gender || '').toLowerCase();
    const isFemale = ['female', 'f', 'woman', '여', '여성'].some((token) =>
      normalizedGender.includes(token),
    );
    const isMale = ['male', 'm', 'man', '남', '남성'].some((token) =>
      normalizedGender.includes(token),
    );

    if (likesPeople && !likesSolo) {
      if (isFemale) return '밖순이';
      if (isMale) return '밖돌이';
      return '밖돌이';
    }

    if (likesSolo && !likesPeople) {
      if (isFemale) return '집순이';
      if (isMale) return '집돌이';
      return '집돌이';
    }

    return 'unknown';
  }

  private matchInterestCategories(
    interests: Pick<UserInterest, 'interest'>[],
    filters: string[],
  ): string[] {
    if (!filters.length) return [];
    const matched = new Set<string>();
    for (const filter of filters) {
      const config = INTEREST_KEYWORDS[filter];
      if (!config) continue;
      const hasMatch = interests.some((interest) =>
        config.keywords.some((keyword) =>
          interest.interest
            .toLowerCase()
            .includes(keyword.toLowerCase()),
        ),
      );
      if (hasMatch) {
        matched.add(config.label);
      }
    }
    return Array.from(matched);
  }

  private async collectExcludedUserIds(currentUserId: string): Promise<Set<string>> {
    const [blockedRelations, followRelations] = await Promise.all([
      this.prisma.userBlock.findMany({
        where: {
          OR: [
            { blockerId: currentUserId },
            { blockedId: currentUserId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      }),
      this.prisma.follow.findMany({
        where: {
          OR: [
            { followerId: currentUserId },
            { followeeId: currentUserId },
          ],
          status: {
            in: [FollowStatus.ACTIVE, FollowStatus.REQUESTED],
          },
          deletedAt: null,
        },
        select: {
          followerId: true,
          followeeId: true,
        },
      }),
    ]);

    const excluded = new Set<string>([currentUserId]);
    blockedRelations.forEach((relation) => {
      if (relation.blockerId === currentUserId) {
        excluded.add(relation.blockedId);
      } else {
        excluded.add(relation.blockerId);
      }
    });

    followRelations.forEach((relation) => {
      if (relation.followerId === currentUserId) {
        excluded.add(relation.followeeId);
      } else {
        excluded.add(relation.followerId);
      }
    });

    return excluded;
  }
}

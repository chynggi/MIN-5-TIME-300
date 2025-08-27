import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FollowStatus } from '@prisma/client';
import { 
  SocialFriendsQueryDto, 
  SocialFriendsResponseDto, 
  FriendWithDiary 
} from './dto';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  /**
   * 탭별 친구 목록 조회 (통합 API)
   */
  async getFriends(userId: string, query: SocialFriendsQueryDto): Promise<SocialFriendsResponseDto> {
    const limit = Number(query.limit) || 20;
    let cursorId: string | undefined;

    // 커서 디코딩
    if (query.cursor) {
      try {
        cursorId = query.cursor;
      } catch (error) {
        // 커서 파싱 실패 시 무시
      }
    }

    let whereClause: any = {
      followerId: userId,
      status: FollowStatus.ACTIVE,
      deletedAt: null
    };

    // 탭별 필터링
    switch (query.tab) {
      case 'mutual':
        // 맞팔(친구): 내가 팔로우하는 사람 중에서 나도 팔로우 받은 사람
        // 이를 위해 별도의 서브쿼리 사용
        const mutualUserIds = await this.prisma.follow.findMany({
          where: {
            followeeId: userId, // 나를 팔로우하는 사람들
            status: FollowStatus.ACTIVE,
            deletedAt: null
          },
          select: { followerId: true }
        });
        
        const mutualIds = mutualUserIds.map(f => f.followerId);
        whereClause.followeeId = { in: mutualIds };
        break;
      case 'following':
        // 팔로우: 내가 팔로우하는 사람 중에서 나를 팔로우하지 않은 사람
        const followingMeIds = await this.prisma.follow.findMany({
          where: {
            followeeId: userId, // 나를 팔로우하는 사람들
            status: FollowStatus.ACTIVE,
            deletedAt: null
          },
          select: { followerId: true }
        });
        
        const followingMeUserIds = followingMeIds.map(f => f.followerId);
        whereClause.followeeId = { notIn: followingMeUserIds };
        break;
      case 'favorites':
        // 즐겨찾기: isFavorite가 true인 팔로우
        whereClause.isFavorite = true;
        break;
    }

    // 검색 필터
    if (query.q && query.q.trim()) {
      whereClause.followee = {
        ...whereClause.followee,
        username: {
          contains: query.q.trim(),
          mode: 'insensitive'
        }
      };
    }

    // 커서 기반 페이지네이션
    if (cursorId) {
      whereClause.id = { lt: cursorId };
    }

    // Follow 조회 시 최근 일기 정보도 함께 가져오기 (N+1 문제 해결)
    const follows = await this.prisma.follow.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // 팔로우 시간 순으로 통일
      take: limit + 1, // 다음 페이지 존재 여부 확인용
      include: {
        followee: {
          select: {
            id: true,
            username: true,
            mbti: true,
            profileImageUrl: true,
            journals: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                createdAt: true,
                mediaUrl: true,
                mediaType: true,
              }
            }
          }
        }
      }
    });

    const hasMore = follows.length > limit;
    const data = hasMore ? follows.slice(0, limit) : follows;

    let nextCursor: string | null = null;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      nextCursor = lastItem.id;
    }

    // 결과 매핑
    const items: FriendWithDiary[] = data.map(follow => {
      const lastJournal = follow.followee.journals[0];
      
      return {
        id: follow.id,
        user: {
          id: follow.followee.id,
          username: follow.followee.username,
          mbti: follow.followee.mbti || '',
          profileImageUrl: follow.followee.profileImageUrl
        },
        status: follow.status,
        isFavorite: follow.isFavorite,
        lastDiary: lastJournal ? {
          id: lastJournal.id,
          createdAt: lastJournal.createdAt.toISOString(),
          hasPhoto: !!(lastJournal.mediaUrl && lastJournal.mediaType?.includes('image')),
          hasAudio: !!(lastJournal.mediaUrl && lastJournal.mediaType?.includes('audio')),
          hasMusic: false // 음악 필드가 별도로 있다면 수정 필요
        } : undefined
      };
    });

    // 전체 카운트 계산 (성능상 별도 조회)
    const total = await this.prisma.follow.count({
      where: {
        ...whereClause,
        id: undefined // 커서 조건 제외
      }
    });

    return {
      items,
      nextCursor,
      total
    };
  }

  /**
   * 즐겨찾기 토글
   */
  async toggleFavorite(userId: string, followId: string, isFavorite: boolean): Promise<void> {
    // 해당 팔로우가 현재 사용자의 것인지 확인
    const follow = await this.prisma.follow.findFirst({
      where: {
        id: followId,
        followerId: userId,
        status: FollowStatus.ACTIVE,
        deletedAt: null
      }
    });

    if (!follow) {
      throw new NotFoundException('팔로우 관계를 찾을 수 없습니다.');
    }

    // 즐겨찾기 상태 업데이트
    await this.prisma.follow.update({
      where: { id: followId },
      data: { 
        isFavorite
      }
    });
  }
}
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationService } from '../notification/notification.service';
import { FollowStatus } from '@prisma/client';
import {
  FollowResponseDto,
  FollowListQueryDto,
  FollowListResponseDto,
  FollowCountersDto,
} from './dto';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * 사용자를 팔로우하거나 팔로우 요청을 보냅니다.
   */
  async followUser(
    followerId: string,
    followeeId: string,
  ): Promise<FollowResponseDto> {
    // 자기 자신을 팔로우할 수 없음
    if (followerId === followeeId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    // 팔로우 대상 사용자 존재 확인
    const followee = await this.prisma.user.findUnique({
      where: { id: followeeId },
      select: {
        id: true,
        isPrivate: true,
        username: true,
        profileImageUrl: true,
      },
    });

    if (!followee) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 차단 관계 확인
    const isBlocked = await this.checkBlockRelationship(followerId, followeeId);
    if (isBlocked) {
      throw new ForbiddenException('팔로우할 수 없습니다.');
    }

    // 기존 팔로우 관계 확인
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    const status = followee.isPrivate
      ? FollowStatus.REQUESTED
      : FollowStatus.ACTIVE;

    const result = await this.prisma.$transaction(async (tx) => {
      let follow;

      if (existingFollow) {
        // 기존 관계가 있는 경우 업데이트
        if (existingFollow.deletedAt) {
          // 소프트 삭제된 관계를 복구
          follow = await tx.follow.update({
            where: { id: existingFollow.id },
            data: {
              status,
              deletedAt: null,
            },
            include: {
              follower: {
                select: { id: true, username: true, profileImageUrl: true },
              },
              followee: {
                select: { id: true, username: true, profileImageUrl: true },
              },
            },
          });
        } else {
          // 이미 활성 상태인 관계
          if (existingFollow.status === FollowStatus.ACTIVE) {
            throw new BadRequestException('이미 팔로우 중입니다.');
          } else if (existingFollow.status === FollowStatus.REQUESTED) {
            throw new BadRequestException('이미 팔로우 요청을 보냈습니다.');
          }
        }
      } else {
        // 새로운 팔로우 관계 생성
        follow = await tx.follow.create({
          data: {
            followerId,
            followeeId,
            status,
          },
          include: {
            follower: {
              select: { id: true, username: true, profileImageUrl: true },
            },
            followee: {
              select: { id: true, username: true, profileImageUrl: true },
            },
          },
        });
      }

      // 공개 계정인 경우 즉시 카운터 업데이트 및 실시간 브로드캐스트
      if (status === FollowStatus.ACTIVE) {
        await this.updateFollowCounters(
          tx,
          followerId,
          followeeId,
          'increment',
        );
      }

      // 알림 생성
      if (followee.isPrivate) {
        // 비공개 계정인 경우 팔로우 요청 알림
        await this.notificationService.handleFollowEvent(
          followerId,
          followeeId,
          'request',
        );
      } else {
        // 공개 계정인 경우 즉시 팔로우 알림
        await this.notificationService.handleFollowEvent(
          followerId,
          followeeId,
          'direct',
        );
      }

      return {
        id: follow.id,
        followerId: follow.followerId,
        followeeId: follow.followeeId,
        status: follow.status,
        createdAt: follow.createdAt,
        follower: follow.follower,
        followee: follow.followee,
      };
    });
    // 트랜잭션 커밋 후 실시간 이벤트 emit (최신 counters 기반)
    if (result.status === FollowStatus.ACTIVE) {
      await this.broadcastCounters([followerId, followeeId]);
    }
    return result;
  }

  /**
   * 팔로우를 해제합니다.
   */
  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    if (!existingFollow || existingFollow.deletedAt) {
      throw new BadRequestException('팔로우 관계가 존재하지 않습니다.');
    }

    const wasActive = existingFollow.status === FollowStatus.ACTIVE;
    await this.prisma.$transaction(async (tx) => {
      // 소프트 삭제
      await tx.follow.update({
        where: { id: existingFollow.id },
        data: { deletedAt: new Date() },
      });

      // 활성 상태였던 경우에만 카운터 감소
      if (wasActive) {
        await this.updateFollowCounters(
          tx,
          followerId,
          followeeId,
          'decrement',
        );
      }
    });
    if (wasActive) {
      await this.broadcastCounters([followerId, followeeId]);
    }
  }

  /**
   * 팔로우 요청을 승인합니다.
   */
  async approveFollowRequest(
    followeeId: string,
    followerId: string,
  ): Promise<FollowResponseDto> {
    const followRequest = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
      include: {
        follower: {
          select: { id: true, username: true, profileImageUrl: true },
        },
        followee: {
          select: { id: true, username: true, profileImageUrl: true },
        },
      },
    });

    if (
      !followRequest ||
      followRequest.deletedAt ||
      followRequest.status !== FollowStatus.REQUESTED
    ) {
      throw new BadRequestException('승인할 팔로우 요청이 존재하지 않습니다.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const follow = await tx.follow.update({
        where: { id: followRequest.id },
        data: { status: FollowStatus.ACTIVE },
        include: {
          follower: {
            select: { id: true, username: true, profileImageUrl: true },
          },
          followee: {
            select: { id: true, username: true, profileImageUrl: true },
          },
        },
      });

      // 카운터 업데이트 및 브로드캐스트
      await this.updateFollowCounters(tx, followerId, followeeId, 'increment');

      // 팔로우 승인 알림 생성
      await this.notificationService.handleFollowEvent(
        followeeId,
        followerId,
        'accept',
      );

      return {
        id: follow.id,
        followerId: follow.followerId,
        followeeId: follow.followeeId,
        status: follow.status,
        createdAt: follow.createdAt,
        follower: follow.follower,
        followee: follow.followee,
      };
    });
    await this.broadcastCounters([followerId, followeeId]);
    return result;
  }

  /**
   * 팔로우 요청을 거절합니다.
   */
  async rejectFollowRequest(
    followeeId: string,
    followerId: string,
  ): Promise<void> {
    const followRequest = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    if (
      !followRequest ||
      followRequest.deletedAt ||
      followRequest.status !== FollowStatus.REQUESTED
    ) {
      throw new BadRequestException('거절할 팔로우 요청이 존재하지 않습니다.');
    }

    // 소프트 삭제
    await this.prisma.follow.update({
      where: { id: followRequest.id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 주어진 사용자 ID 배열에 대해 최신 팔로워/팔로잉 카운터를 계산하여 실시간 전송
   */
  private async broadcastCounters(userIds: string[]) {
    const unique = Array.from(new Set(userIds));
    if (!unique.length) return;
    // followCounters 테이블 한 번에 조회하여 DB count 부하 감소
    const counters = await this.prisma.followCounters.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, followersCount: true, followingCount: true },
    });
    const map = new Map(counters.map((c) => [c.userId, c]));
    for (const uid of unique) {
      const c = map.get(uid);
      if (!c) continue; // 아직 생성되지 않은 경우 skip
      this.realtimeGateway.emitProfileCountersUpdate({
        userId: uid,
        followerCount: c.followersCount,
        followingCount: c.followingCount,
      });
    }
  }

  /**
   * 팔로워 목록을 조회합니다.
   */
  async getFollowers(
    userId: string,
    query: FollowListQueryDto,
    requesterId?: string,
  ): Promise<FollowListResponseDto> {
    // 권한 검사
    if (requesterId) {
      const canView = await this.checkFollowListVisibility(
        userId,
        requesterId,
        'followers',
      );
      if (!canView) {
        throw new ForbiddenException(
          '팔로워 목록을 볼 수 있는 권한이 없습니다.',
        );
      }
    }
    const limit = Number(query.limit) || 20;
    let cursorCreatedAt: Date | undefined;
    let cursorUserId: string | undefined;

    // 커서 디코딩
    if (query.cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(query.cursor, 'base64').toString(),
        );
        cursorCreatedAt = new Date(cursorData.createdAt);
        cursorUserId = cursorData.userId;
      } catch (error) {
        // 커서 파싱 실패 시 무시
      }
    }

    const whereClause: any = {
      followeeId: userId,
      status: FollowStatus.ACTIVE,
      deletedAt: null,
    };

    // 커서 기반 페이지네이션
    if (cursorCreatedAt && cursorUserId) {
      whereClause.OR = [
        {
          createdAt: { lt: cursorCreatedAt },
        },
        {
          createdAt: cursorCreatedAt,
          followerId: { lt: cursorUserId },
        },
      ];
    }

    const followers = await this.prisma.follow.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }, { followerId: 'desc' }],
      take: limit + 1, // 다음 페이지 존재 여부 확인용
      include: {
        follower: {
          select: { id: true, username: true, profileImageUrl: true },
        },
      },
    });

    const hasMore = followers.length > limit;
    const data = hasMore ? followers.slice(0, limit) : followers;

    let nextCursor: string | undefined;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: lastItem.createdAt.toISOString(),
          userId: lastItem.followerId,
        }),
      ).toString('base64');
    }

    return {
      data: data.map((follow) => ({
        id: follow.id,
        followerId: follow.followerId,
        followeeId: follow.followeeId,
        status: follow.status,
        createdAt: follow.createdAt,
        follower: follow.follower,
      })),
      hasMore,
      nextCursor,
    };
  }

  /**
   * 팔로잉 목록을 조회합니다.
   */
  async getFollowing(
    userId: string,
    query: FollowListQueryDto,
    requesterId?: string,
  ): Promise<FollowListResponseDto> {
    // 권한 검사
    if (requesterId) {
      const canView = await this.checkFollowListVisibility(
        userId,
        requesterId,
        'following',
      );
      if (!canView) {
        throw new ForbiddenException(
          '팔로잉 목록을 볼 수 있는 권한이 없습니다.',
        );
      }
    }
    const limit = Number(query.limit) || 20;
    let cursorCreatedAt: Date | undefined;
    let cursorUserId: string | undefined;

    // 커서 디코딩
    if (query.cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(query.cursor, 'base64').toString(),
        );
        cursorCreatedAt = new Date(cursorData.createdAt);
        cursorUserId = cursorData.userId;
      } catch (error) {
        // 커서 파싱 실패 시 무시
      }
    }

    const whereClause: any = {
      followerId: userId,
      status: FollowStatus.ACTIVE,
      deletedAt: null,
    };

    // 커서 기반 페이지네이션
    if (cursorCreatedAt && cursorUserId) {
      whereClause.OR = [
        {
          createdAt: { lt: cursorCreatedAt },
        },
        {
          createdAt: cursorCreatedAt,
          followeeId: { lt: cursorUserId },
        },
      ];
    }

    const following = await this.prisma.follow.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }, { followeeId: 'desc' }],
      take: limit + 1, // 다음 페이지 존재 여부 확인용
      include: {
        followee: {
          select: { id: true, username: true, profileImageUrl: true },
        },
      },
    });

    const hasMore = following.length > limit;
    const data = hasMore ? following.slice(0, limit) : following;

    let nextCursor: string | undefined;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: lastItem.createdAt.toISOString(),
          userId: lastItem.followeeId,
        }),
      ).toString('base64');
    }

    return {
      data: data.map((follow) => ({
        id: follow.id,
        followerId: follow.followerId,
        followeeId: follow.followeeId,
        status: follow.status,
        createdAt: follow.createdAt,
        followee: follow.followee,
      })),
      hasMore,
      nextCursor,
    };
  }

  /**
   * 팔로우 요청 목록을 조회합니다.
   */
  async getFollowRequests(
    userId: string,
    query: FollowListQueryDto,
  ): Promise<FollowListResponseDto> {
    const limit = Number(query.limit) || 20;
    let cursorCreatedAt: Date | undefined;
    let cursorUserId: string | undefined;

    // 커서 디코딩
    if (query.cursor) {
      try {
        const cursorData = JSON.parse(
          Buffer.from(query.cursor, 'base64').toString(),
        );
        cursorCreatedAt = new Date(cursorData.createdAt);
        cursorUserId = cursorData.userId;
      } catch (error) {
        // 커서 파싱 실패 시 무시
      }
    }

    const whereClause: any = {
      followeeId: userId,
      status: FollowStatus.REQUESTED,
      deletedAt: null,
    };

    // 커서 기반 페이지네이션
    if (cursorCreatedAt && cursorUserId) {
      whereClause.OR = [
        {
          createdAt: { lt: cursorCreatedAt },
        },
        {
          createdAt: cursorCreatedAt,
          followerId: { lt: cursorUserId },
        },
      ];
    }

    const requests = await this.prisma.follow.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }, { followerId: 'desc' }],
      take: limit + 1,
      include: {
        follower: {
          select: { id: true, username: true, profileImageUrl: true },
        },
      },
    });

    const hasMore = requests.length > limit;
    const data = hasMore ? requests.slice(0, limit) : requests;

    let nextCursor: string | undefined;
    if (hasMore) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: lastItem.createdAt.toISOString(),
          userId: lastItem.followerId,
        }),
      ).toString('base64');
    }

    return {
      data: data.map((follow) => ({
        id: follow.id,
        followerId: follow.followerId,
        followeeId: follow.followeeId,
        status: follow.status,
        createdAt: follow.createdAt,
        follower: follow.follower,
      })),
      hasMore,
      nextCursor,
    };
  }

  /**
   * 팔로우 카운터를 조회합니다.
   */
  async getFollowCounters(userId: string): Promise<FollowCountersDto> {
    let counters = await this.prisma.followCounters.findUnique({
      where: { userId },
    });

    if (!counters) {
      // 카운터가 없는 경우 실시간 계산하여 생성
      const [followersCount, followingCount] = await Promise.all([
        this.prisma.follow.count({
          where: {
            followeeId: userId,
            status: FollowStatus.ACTIVE,
            deletedAt: null,
          },
        }),
        this.prisma.follow.count({
          where: {
            followerId: userId,
            status: FollowStatus.ACTIVE,
            deletedAt: null,
          },
        }),
      ]);

      counters = await this.prisma.followCounters.create({
        data: {
          userId,
          followersCount,
          followingCount,
        },
      });
    }

    return {
      followersCount: counters.followersCount,
      followingCount: counters.followingCount,
      updatedAt: counters.updatedAt,
    };
  }

  /**
   * 두 사용자 간의 팔로우 관계를 확인합니다.
   */
  async getFollowRelationship(followerId: string, followeeId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId,
        },
      },
    });

    if (!follow || follow.deletedAt) {
      return { status: 'none' };
    }

    return {
      status: follow.status.toLowerCase(),
      createdAt: follow.createdAt,
    };
  }

  /**
   * 차단 관계를 확인합니다.
   */
  private async checkBlockRelationship(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });

    return !!block;
  }

  /**
   * 팔로우 카운터를 업데이트합니다.
   */
  private async updateFollowCounters(
    tx: any,
    followerId: string,
    followeeId: string,
    operation: 'increment' | 'decrement',
  ) {
    const increment = operation === 'increment' ? 1 : -1;

    // decrement 시 음수 방지 위해 조건 적용 (Prisma 5: raw 작성 없이 2-step)
    // followersCount 업데이트
    const followeeCounter = await tx.followCounters.upsert({
      where: { userId: followeeId },
      update: {
        followersCount: { increment },
      },
      create: {
        userId: followeeId,
        followersCount: increment > 0 ? increment : 0,
        followingCount: 0,
      },
    });
    if (followeeCounter.followersCount < 0) {
      await tx.followCounters.update({
        where: { userId: followeeId },
        data: { followersCount: 0 },
      });
    }

    const followerCounter = await tx.followCounters.upsert({
      where: { userId: followerId },
      update: {
        followingCount: { increment },
      },
      create: {
        userId: followerId,
        followersCount: 0,
        followingCount: increment > 0 ? increment : 0,
      },
    });
    if (followerCounter.followingCount < 0) {
      await tx.followCounters.update({
        where: { userId: followerId },
        data: { followingCount: 0 },
      });
    }
  }

  /**
   * 사용자를 차단합니다.
   */
  async blockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<{
    success: boolean;
    blockerId: string;
    blockedId: string;
    createdAt: Date;
  }> {
    if (blockerId === blockedId) {
      throw new Error('자신을 차단할 수 없습니다.');
    }

    // 이미 차단된 관계인지 확인
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new Error('이미 차단된 사용자입니다.');
    }

    // 차단 관계 생성
    const block = await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    // 기존 팔로우 관계 삭제 (양방향)
    await this.prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followeeId: blockedId },
          { followerId: blockedId, followeeId: blockerId },
        ],
      },
    });

    // 팔로우 카운터 업데이트는 트랜잭션 밖에서 실행
    await this.prisma.$transaction(async (tx) => {
      await this.updateFollowCounters(tx, blockerId, blockedId, 'decrement');
      await this.updateFollowCounters(tx, blockedId, blockerId, 'decrement');
    });

    return {
      success: true,
      blockerId: block.blockerId,
      blockedId: block.blockedId,
      createdAt: block.createdAt,
    };
  }

  /**
   * 사용자 차단을 해제합니다.
   */
  async unblockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<{ success: boolean }> {
    const deletedBlock = await this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!deletedBlock) {
      throw new Error('차단되지 않은 사용자입니다.');
    }

    return { success: true };
  }

  /**
   * 차단한 사용자 목록을 조회합니다.
   */
  async getBlockedUsers(
    userId: string,
  ): Promise<
    { id: string; username: string; profileImageUrl?: string | null }[]
  > {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        blockerId: userId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return blocks.map((block) => ({
      id: block.blocked.id,
      username: block.blocked.username,
      profileImageUrl: block.blocked.profileImageUrl,
    }));
  }

  /**
   * 팔로우 목록 조회 권한을 확인합니다.
   */
  private async checkFollowListVisibility(
    targetUserId: string,
    requesterId: string,
    listType: 'followers' | 'following',
  ): Promise<boolean> {
    // 본인인 경우 항상 허용
    if (targetUserId === requesterId) {
      return true;
    }

    // 차단 관계 확인
    const isBlocked = await this.checkBlockRelationship(
      requesterId,
      targetUserId,
    );
    if (isBlocked) {
      return false;
    }

    // 프라이버시 설정 조회
    const privacySettings = await this.prisma.privacySettings.findUnique({
      where: { userId: targetUserId },
    });

    // 프라이버시 설정이 없으면 기본값 사용 (PUBLIC)
    const visibility =
      listType === 'followers'
        ? privacySettings?.followersVisibility || 'PUBLIC'
        : privacySettings?.followingVisibility || 'PUBLIC';

    switch (visibility) {
      case 'PUBLIC':
        return true;
      case 'FRIENDS':
        // 팔로우 관계 확인
        const isFollowing = await this.prisma.follow.findFirst({
          where: {
            followerId: requesterId,
            followeeId: targetUserId,
            status: FollowStatus.ACTIVE,
            deletedAt: null,
          },
        });
        return !!isFollowing;
      case 'PRIVATE':
        return false;
      default:
        return true; // 기본값은 공개
    }
  }
}

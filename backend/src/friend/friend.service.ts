import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { FriendListResponseDto, FriendRequestDto, FriendRequestResponseDto, FriendRespondDto, FriendRespondResponseDto, RecommendFriendsResponseDto } from './dto/friend.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async getFriends(req: any, status?: 'pending' | 'accepted' | 'all'): Promise<FriendListResponseDto> {
    const userId = req.user.userId;
    const where: any = {
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    };
    if (status && status !== 'all') {
      where.status = status;
    }
    const friends = await this.prisma.friend.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: true,
        addressee: true,
      },
    });
    return {
      friends: friends.map(f => {
        const other = f.requesterId === userId ? f.addressee : f.requester;
        return {
          id: f.id,
          user: {
            id: other.id,
            username: other.username,
            mbti: other.mbti ?? '',
            profileImageUrl: other.profileImageUrl || undefined,
          },
          status: f.status === 'pending' ? 'pending' : 'accepted',
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        };
      }),
    };
  }

  async requestFriend(req: any, dto: FriendRequestDto): Promise<FriendRequestResponseDto> {
    const userId = req.user.userId;
    if (userId === dto.userId) throw new ForbiddenException('자기 자신에게 친구 요청 불가');
    const exists = await this.prisma.friend.findFirst({
      where: {
        requesterId: userId,
        addresseeId: dto.userId,
        status: 'pending',
      },
    });
    if (exists) throw new ConflictException('이미 친구 요청이 존재합니다.');
    const request = await this.prisma.friend.create({
      data: {
        requesterId: userId,
        addresseeId: dto.userId,
        status: 'pending',
      },
    });
    return {
      success: true,
      message: '친구 요청 완료',
      requestId: request.id,
    };
  }

  async respondFriend(req: any, id: string, dto: FriendRespondDto): Promise<FriendRespondResponseDto> {
    const userId = req.user.userId;
    
    // ID가 실제 친구 관계 ID인지 확인하고, 그렇지 않다면 사용자 ID로 처리
    let friend = await this.prisma.friend.findUnique({ where: { id } });
    
    if (!friend) {
      // ID가 사용자 ID일 가능성이 있으므로 친구 관계를 찾아봄
      friend = await this.prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: id },
            { requesterId: id, addresseeId: userId },
          ]
        }
      });
    }
    
    if (!friend) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }
    
    // 친구 해제 (accept: false)인 경우
    if (!dto.accept) {
      await this.prisma.friend.delete({ where: { id: friend.id } });
      return {
        success: true,
        message: '친구 관계 해제',
        status: 'removed',
      };
    }
    
    // 친구 요청 수락인 경우 - 본인에게 온 요청만 수락 가능
    if (friend.addresseeId !== userId) {
      throw new ForbiddenException('본인에게 온 요청만 응답할 수 있습니다.');
    }
    
    const updated = await this.prisma.friend.update({
      where: { id: friend.id },
      data: { status: 'accepted' },
    });
    
    return {
      success: true,
      message: '친구 요청 수락',
      status: 'accepted',
    };
  }
  /**
   * 관심사 및 라이프스타일이 비슷한 사용자 추천 (임시: 랜덤 사용자)
   */
  async recommendUsers(req: any): Promise<RecommendFriendsResponseDto> {
    const userId = req.user.userId;
    
    // 이미 친구인 사용자들 가져오기
    const existingFriends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
        status: { in: ['accepted', 'pending'] }
      },
      select: {
        requesterId: true,
        addresseeId: true,
      }
    });
    
    const friendIds = new Set<string>();
    existingFriends.forEach(f => {
      if (f.requesterId === userId) {
        friendIds.add(f.addresseeId);
      } else {
        friendIds.add(f.requesterId);
      }
    });
    friendIds.add(userId); // 본인도 제외

    // 디버깅: 전체 사용자 수 확인
    const totalUsers = await this.prisma.user.count();
    console.log(`[DEBUG] Total users in database: ${totalUsers}`);

    // 임시: 랜덤 사용자 추천 (복잡한 로직 대신 단순하게)
    const randomUsers = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(friendIds) },
        // isActive 조건 제거 - 모든 사용자 포함
      },
      select: {
        id: true,
        username: true,
        mbti: true,
        profileImageUrl: true,
      },
      take: 20, // 더 많이 가져와서 랜덤 선택
    });

    // 만약 위 쿼리에서 결과가 없다면, 조건 없이 모든 사용자 조회 (테스트용)
    if (randomUsers.length === 0) {
      console.log('[DEBUG] No users found with exclusion, trying without exclusion...');
      const allUsers = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          mbti: true,
          profileImageUrl: true,
        },
        take: 10,
      });
      console.log(`[DEBUG] All users (first 10):`, allUsers);
      
      // 본인만 제외하고 추천
      const filteredUsers = allUsers.filter(u => u.id !== userId);
      console.log(`[DEBUG] Filtered users (excluding self):`, filteredUsers);
      
      const recommendations = filteredUsers
        .slice(0, 8)
        .map(u => ({ 
          id: u.id, 
          username: u.username, 
          mbti: u.mbti || '', 
          profileImageUrl: u.profileImageUrl || undefined 
        }));

      console.log(`[DEBUG] Final recommendations:`, recommendations);
      return { recommendations };
    }
    
    // 랜덤 셔플 후 최대 8명 선택
    const shuffled = randomUsers.sort(() => Math.random() - 0.5);
    const recommendations = shuffled
      .slice(0, 8)
      .map(u => ({ 
        id: u.id, 
        username: u.username, 
        mbti: u.mbti || '', 
        profileImageUrl: u.profileImageUrl || undefined 
      }));

    // 디버깅용 로그
    console.log(`[DEBUG] userId: ${userId}`);
    console.log(`[DEBUG] friendIds: ${Array.from(friendIds)}`);
    console.log(`[DEBUG] randomUsers count: ${randomUsers.length}`);
    console.log(`[DEBUG] recommendations count: ${recommendations.length}`);
    console.log(`[DEBUG] recommendations:`, recommendations);

    return { recommendations };
  }
}

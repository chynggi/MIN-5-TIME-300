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
    const friend = await this.prisma.friend.findUnique({ where: { id } });
    if (!friend) throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    if (friend.addresseeId !== userId) throw new ForbiddenException('본인에게 온 요청만 응답할 수 있습니다.');
    const updated = await this.prisma.friend.update({
      where: { id },
      data: { status: dto.accept ? 'accepted' : 'rejected' },
    });
    return {
      success: true,
      message: dto.accept ? '친구 요청 수락' : '친구 요청 거절',
      status: dto.accept ? 'accepted' : 'rejected',
    };
  }
  /**
   * 관심사 및 라이프스타일이 비슷한 사용자 추천
   */
  async recommendUsers(req: any): Promise<RecommendFriendsResponseDto> {
    const userId = req.user.userId;
    // 현재 유저의 interests와 lifestyleAnswers 가져오기
    const userInterests = await this.prisma.userInterest.findMany({ where: { userId } });
    const userLifestyle = await this.prisma.lifestyleAnswer.findMany({ where: { userId } });
    const interestSet = new Set(userInterests.map(ui => ui.interest));
    const lifestyleSet = new Set(userLifestyle.map(ua => ua.answer));
    // 다른 사용자들의 interests 및 lifestyle 조회
    const otherInterests = await this.prisma.userInterest.findMany({ where: { interest: { in: Array.from(interestSet) } }, include: { user: true } });
    const otherLifestyle = await this.prisma.lifestyleAnswer.findMany({ where: { answer: { in: Array.from(lifestyleSet) } }, include: { user: true } });
    // 매칭 점수 계산
    const scoreMap: Record<string, number> = {};
    otherInterests.forEach(item => {
      if (item.userId === userId) return;
      scoreMap[item.userId] = (scoreMap[item.userId] || 0) + 1;
    });
    otherLifestyle.forEach(item => {
      if (item.userId === userId) return;
      scoreMap[item.userId] = (scoreMap[item.userId] || 0) + 1;
    });
    // 점수 높은 순 정렬
    const sortedUserIds = Object.entries(scoreMap)
      .sort(([, a], [, b]) => b - a)
      .map(([uid]) => uid)
      .slice(0, 10);
    // 사용자 정보 조회
    const users = await this.prisma.user.findMany({ where: { id: { in: sortedUserIds } } });
    // DTO 반환
    const recommendations = users.map(u => ({ id: u.id, username: u.username, mbti: u.mbti || '', profileImageUrl: u.profileImageUrl || undefined }));
    return { recommendations };
  }
}

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { FriendListResponseDto, FriendRequestDto, FriendRequestResponseDto, FriendRespondDto, FriendRespondResponseDto } from './dto/friend.dto';
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
}

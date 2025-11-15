import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SearchUsersDto } from './dto/search-users.dto';
import { SearchUserResponseDto } from './dto/search-user-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(
    currentUserId: string,
    dto: SearchUsersDto,
  ): Promise<{ users: SearchUserResponseDto[] }> {
    const { q, limit } = dto;
    const limitNum = parseInt(limit || '10') || 10;

    // 사용자 검색 (username에서 쿼리와 일치하는 부분이 있는 사용자들)
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            username: {
              contains: q,
              mode: 'insensitive', // 대소문자 무시
            },
          },
          {
            id: {
              not: currentUserId, // 본인 제외
            },
          },
        ],
      },
      take: limitNum,
      select: {
        id: true,
        username: true,
        mbti: true,
        profileImageUrl: true,
      },
    });

    // 각 사용자와의 친구 관계 확인
    const usersWithRelation = await Promise.all(
      users.map(async (user) => {
        // 친구 관계 확인 (양방향)
        const friendRelation = await this.prisma.friend.findFirst({
          where: {
            OR: [
              {
                requesterId: currentUserId,
                addresseeId: user.id,
              },
              {
                requesterId: user.id,
                addresseeId: currentUserId,
              },
            ],
          },
        });

        return {
          id: user.id,
          username: user.username,
          mbti: user.mbti || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          isFollowing: friendRelation?.status === 'accepted',
          isFriend: friendRelation?.status === 'accepted',
        };
      }),
    );

    return {
      users: usersWithRelation,
    };
  }
}

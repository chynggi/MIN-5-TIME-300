import { FollowStatus } from '@prisma/client';

export class FollowResponseDto {
  id: string;
  followerId: string;
  followeeId: string;
  status: FollowStatus;
  createdAt: Date;
  follower?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
  followee?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
}
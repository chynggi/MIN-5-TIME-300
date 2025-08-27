// Follow 상태 타입
export type FollowStatus = 'ACTIVE' | 'REQUESTED';

// 팔로우 응답 DTO
export interface FollowResponseDto {
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

// 팔로우 목록 응답 DTO
export interface FollowListResponseDto {
  data: FollowResponseDto[];
  hasMore: boolean;
  nextCursor?: string;
}

// 팔로우 카운터 DTO
export interface FollowCountersDto {
  followersCount: number;
  followingCount: number;
  updatedAt: Date;
}

// 팔로우 목록 쿼리 파라미터
export interface FollowListQueryDto {
  limit?: number;
  cursor?: string;
}

// 팔로우 관계 상태
export interface FollowRelationshipDto {
  status: 'none' | 'active' | 'requested';
  createdAt?: Date;
}

// 차단 관련 DTO
export interface BlockUserDto {
  userId: string;
}

export interface BlockResponseDto {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}
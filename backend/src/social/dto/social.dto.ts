export interface SocialFriendsQueryDto {
  tab: 'mutual' | 'following' | 'favorites';
  cursor?: string;
  limit?: number;
  q?: string; // 검색 쿼리
}

export interface LastDiary {
  id: string;
  createdAt: string;
  hasPhoto: boolean;
  hasAudio: boolean;
  hasMusic: boolean;
}

export interface FriendUser {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string | null;
}

export interface FriendWithDiary {
  id: string; // Follow ID
  user: FriendUser;
  status: string;
  isFavorite: boolean;
  lastDiary?: LastDiary;
}

export interface SocialFriendsResponseDto {
  items: FriendWithDiary[];
  nextCursor: string | null;
  total: number;
}

export interface UpdateFavoriteDto {
  isFavorite: boolean;
}
export interface FriendUserDto {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

export interface FriendListItemDto {
  id: string;
  user: FriendUserDto;
  status: 'pending' | 'accepted';
  createdAt: string;
  updatedAt: string;
}

export interface FriendListResponseDto {
  friends: FriendListItemDto[];
}

export interface FriendRequestDto {
  userId: string;
}

export interface FriendRequestResponseDto {
  success: boolean;
  message: string;
  requestId: string;
}

export interface FriendRespondDto {
  accept: boolean;
}

export interface FriendRespondResponseDto {
  success: boolean;
  message: string;
  status: 'accepted' | 'rejected';
}

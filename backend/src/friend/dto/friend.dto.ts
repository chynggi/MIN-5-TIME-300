import { IsString, IsOptional, IsIn } from 'class-validator';

export class FriendUserDto {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

export class FriendListItemDto {
  id: string;
  user: FriendUserDto;
  status: 'pending' | 'accepted';
  createdAt: string;
  updatedAt: string;
}

export class FriendListResponseDto {
  friends: FriendListItemDto[];
}

export class FriendRequestDto {
  @IsString()
  userId: string;
}

export class FriendRequestResponseDto {
  success: boolean;
  message: string;
  requestId: string;
}

export class FriendRespondDto {
  @IsOptional()
  @IsIn([true, false])
  accept: boolean;
}

export class FriendRespondResponseDto {
  success: boolean;
  message: string;
  status: 'accepted' | 'rejected';
}
// 추천 친구 응답용 DTO
export class RecommendUserDto {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

export class RecommendFriendsResponseDto {
  recommendations: RecommendUserDto[];
}

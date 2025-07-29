export class ProfileInterestDto {
  id: string;
  interest: string;
  priority: number;
}

export class ProfileResponseDto {
  id: string;
  email: string;
  username: string;
  mbti: string;
  profileImageUrl: string;
  interests: ProfileInterestDto[];
  createdAt: string;
}
// 타인 프로필 상세 응답 DTO
export class OtherProfileResponseDto {
  id: string;
  username: string;
  bio?: string;
  diaryCount: number;
  followerCount: number;
  followingCount: number;
  lpgScore: number;
  isFollowing: boolean;
  isPublic: boolean;
  mbti: string;
}

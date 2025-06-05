export interface ProfileInterestDto {
  id: string;
  interest: string;
  priority: number;
}

export interface ProfileResponseDto {
  id: string;
  email: string;
  username: string;
  mbti: string;
  profileImageUrl: string;
  interests: ProfileInterestDto[];
  createdAt: string;
}

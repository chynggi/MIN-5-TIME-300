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

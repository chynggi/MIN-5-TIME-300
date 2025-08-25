export class ProfileEditBasicInfoDto {
  username: string;
  bio?: string;
  mbti?: string;
  location?: string;
  birthDate?: string;
  profileImageUrl?: string;
}

export class ProfileEditInterestDto {
  id: string;
  interest: string;
  priority: number;
}

export class ProfileEditLifestyleDto {
  workStyle?: string;
  exerciseFrequency?: string;
  sleepPattern?: string;
  socialActivity?: string;
}

export class ProfileEditLifestyleAnswerDto {
  question: string;
  answer: string;
}

export class ProfileEditPrivacyDto {
  isProfilePublic: boolean;
  showMbti: boolean;
  showLocation: boolean;
  showBirthDate: boolean;
  allowFollowRequests: boolean;
  showDiariesToFriends: boolean;
  showDiariesToPublic: boolean;
}

/**
 * 프로필 편집 페이지에서 필요한 모든 정보를 담는 DTO
 */
export class ProfileEditResponseDto {
  basicInfo: ProfileEditBasicInfoDto;
  interests: ProfileEditInterestDto[];
  lifestyle: ProfileEditLifestyleDto;
  lifestyleAnswers: ProfileEditLifestyleAnswerDto[];
  privacy: ProfileEditPrivacyDto;
}
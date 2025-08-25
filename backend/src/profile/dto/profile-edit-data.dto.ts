import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

/**
 * 프로필 편집을 위한 기본 정보 응답 DTO
 */
export class ProfileBasicInfoDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

/**
 * 관심사 정보 DTO
 */
export class InterestInfoDto {
  id: string;
  interest: string;
  priority: number;
}

/**
 * 라이프스타일 정보 DTO
 */
export class LifestyleInfoDto {
  @IsOptional()
  @IsString()
  workStyle?: string;

  @IsOptional()
  @IsString()
  exerciseFrequency?: string;

  @IsOptional()
  @IsString()
  sleepPattern?: string;

  @IsOptional()
  @IsString()
  socialActivity?: string;
}

/**
 * 프로필 편집을 위한 종합 정보 응답 DTO
 */
export class ProfileEditDataDto {
  basicInfo: ProfileBasicInfoDto;
  interests: InterestInfoDto[];
  lifestyle: LifestyleInfoDto;
  
  // 개인정보 공개 설정
  privacySettings: {
    isProfilePublic: boolean;
    showMbti: boolean;
    showLocation: boolean;
    showBirthDate: boolean;
    allowFollowRequests: boolean;
    showDiariesToFriends: boolean;
    showDiariesToPublic: boolean;
  };
}

/**
 * 관심사 선택을 위한 옵션들과 현재 선택된 항목들
 */
export class InterestOptionsDto {
  // 선택 가능한 모든 관심사 옵션들 (프론트엔드에서 미리 정의된 목록)
  availableInterests: string[];
  
  // 현재 사용자가 선택한 관심사들
  selectedInterests: InterestInfoDto[];
}

/**
 * 라이프스타일 선택을 위한 옵션들과 현재 선택된 항목들
 */
export class LifestyleOptionsDto {
  // 선택 가능한 옵션들
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
  
  // 현재 사용자가 선택한 값들
  currentSelections: LifestyleInfoDto;
}
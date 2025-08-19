import { IsOptional, IsString, IsUrl, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBasicInfoDto {
  @IsOptional()
  @IsString()
  username?: string;

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
}

export class UpdateProfileImageDto {
  @IsString()
  @IsUrl()
  profileImageUrl: string;
}

export class UpdatePrivacyDto {
  @IsOptional()
  isProfilePublic?: boolean;

  @IsOptional()
  showMbti?: boolean;

  @IsOptional()
  showLocation?: boolean;

  @IsOptional()
  showBirthDate?: boolean;

  @IsOptional()
  allowFollowRequests?: boolean;

  @IsOptional()
  showDiariesToFriends?: boolean;

  @IsOptional()
  showDiariesToPublic?: boolean;
}

export class UpdateLifestyleDto {
  @IsOptional()
  @IsString()
  workStyle?: string; // '재택근무', '출근', '프리랜서' 등

  @IsOptional()
  @IsString()
  exerciseFrequency?: string; // '매일', '주 3-4회', '가끔' 등

  @IsOptional()
  @IsString()
  sleepPattern?: string; // '아침형', '저녁형', '불규칙' 등

  @IsOptional()
  @IsString()
  socialActivity?: string; // '외향적', '내향적', '상황에 따라' 등
}

export class ProfileCompleteDto {
  basic: UpdateBasicInfoDto;
  interests: string[];
  lifestyle: UpdateLifestyleDto;
  privacy: UpdatePrivacyDto;
}

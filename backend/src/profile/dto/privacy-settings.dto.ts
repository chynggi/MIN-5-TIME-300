import { IsOptional, IsBoolean, IsEnum, IsArray, IsString } from 'class-validator';

export enum VisibilityLevel {
  PUBLIC = 'PUBLIC',        // 모든 사람에게 공개
  FRIENDS = 'FRIENDS',      // 친구들에게만 공개
  PRIVATE = 'PRIVATE'       // 비공개
}

export class DetailedPrivacyDto {
  // 프로필 전체 공개 수준
  @IsOptional()
  @IsEnum(VisibilityLevel)
  profileVisibility?: VisibilityLevel;

  // 개별 정보 공개 설정
  @IsOptional()
  @IsEnum(VisibilityLevel)
  mbtiVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  locationVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  birthDateVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  interestsVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  lifestyleVisibility?: VisibilityLevel;

  // 팔로우/팔로잉 목록 공개 설정
  @IsOptional()
  @IsEnum(VisibilityLevel)
  followersVisibility?: VisibilityLevel;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  followingVisibility?: VisibilityLevel;

  // 일기 공개 설정
  @IsOptional()
  @IsEnum(VisibilityLevel)
  diaryDefaultVisibility?: VisibilityLevel;

  // 특수 설정
  @IsOptional()
  @IsBoolean()
  allowFollowRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDirectMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  showInRecommendations?: boolean;

  // 차단된 사용자 목록
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedUserIds?: string[];
}

export class BlockUserDto {
  @IsString()
  targetUserId: string;
}

export class UnblockUserDto {
  @IsString()
  targetUserId: string;
}

export class PrivacySettingsResponseDto {
  profileVisibility: VisibilityLevel;
  mbtiVisibility: VisibilityLevel;
  locationVisibility: VisibilityLevel;
  birthDateVisibility: VisibilityLevel;
  interestsVisibility: VisibilityLevel;
  lifestyleVisibility: VisibilityLevel;
  followersVisibility: VisibilityLevel;
  followingVisibility: VisibilityLevel;
  diaryDefaultVisibility: VisibilityLevel;
  allowFollowRequests: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  showInRecommendations: boolean;
  blockedUsers: Array<{
    id: string;
    username: string;
    profileImageUrl?: string;
  }>;
}

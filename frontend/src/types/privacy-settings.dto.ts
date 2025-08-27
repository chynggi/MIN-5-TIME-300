export type VisibilityLevel = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export interface DetailedPrivacyDto {
  profileVisibility?: VisibilityLevel;
  mbtiVisibility?: VisibilityLevel;
  locationVisibility?: VisibilityLevel;
  birthDateVisibility?: VisibilityLevel;
  interestsVisibility?: VisibilityLevel;
  lifestyleVisibility?: VisibilityLevel;
  followersVisibility?: VisibilityLevel;
  followingVisibility?: VisibilityLevel;
  diaryDefaultVisibility?: VisibilityLevel;
  allowFollowRequests?: boolean;
  showOnlineStatus?: boolean;
  allowDirectMessages?: boolean;
  showInRecommendations?: boolean;
  blockedUserIds?: string[];
}

export interface PrivacySettingsResponseDto {
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

export interface FollowPrivacySettings {
  followersVisibility: VisibilityLevel;
  followingVisibility: VisibilityLevel;
}
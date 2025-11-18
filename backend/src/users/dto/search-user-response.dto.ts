export class SearchUserResponseDto {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
  isFriend?: boolean;
  followStatus?: 'none' | 'active' | 'requested';
  age?: number | null;
  lastActiveAt?: string | null;
  lifestyleTime?: 'sun' | 'moon' | 'question';
  lifestyleSocial?: '집순이' | '집돌이' | '밖순이' | '밖돌이' | 'unknown';
  matchedInterests?: string[];
  compatibilityScore?: number;
  activityScore?: number | null;
}

export class CommunityDiaryUserDto {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

export class CommunityDiaryReactionCountsDto {
  like: number;
  hug: number;
  support: number;
}
export interface CommunityDiaryListItemDto {
  id: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  user: CommunityDiaryUserDto;
  reactionCounts: CommunityDiaryReactionCountsDto;
  commentCount: number;
  lat?: number;
  lng?: number;
}

export class CommunityDiaryListResponseDto {
  diaries: CommunityDiaryListItemDto[];
  totalCount: number;
  page: number;
  limit: number;
}

export class DiaryListItemDto {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
}

export class DiaryListResponseDto {
  diaries: DiaryListItemDto[];
  totalCount: number;
  page: number;
  limit: number;
}

export class DiaryDetailReactionDto {
  type: string;
  count: number;
  reacted: boolean;
}

export class DiaryDetailResponseDto {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  writingDuration: number;
  reactions: DiaryDetailReactionDto[];
}

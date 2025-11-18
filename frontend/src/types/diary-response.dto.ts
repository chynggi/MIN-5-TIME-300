export interface DiaryListItemDto {
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

export interface DiaryListResponseDto {
  diaries: DiaryListItemDto[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface DiaryDetailReactionDto {
  type: string;
  count: number;
  reacted: boolean;
}

export interface DiaryDetailResponseDto {
  id: string;
  content: string;
  createdAt: string;
  diaryDate?: string;
  updatedAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  writingDuration: number;
  reactions: DiaryDetailReactionDto[];
  selectedQuestions?: { domain?: string; text: string; answer?: string }[];
}

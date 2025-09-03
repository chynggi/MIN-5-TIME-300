export class DiaryListItemDto {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  diaryDate: string; // 일기 날짜 필드 추가
  isRetrospective?: boolean; // 회고 작성 여부
  isPublic: boolean;
  emotionScore: number;
  emotion?: string; // 감정 이모지 필드 추가
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  lat?: number;
  lng?: number;
  likes?: number; // 좋아요 수 (인기 정렬용)
  username?: string; // 작성자 표시 (인기 목록 공용 사용)
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
  diaryDate: string; // 일기 날짜 필드 추가
  isRetrospective?: boolean; // 회고 작성 여부
  isPublic: boolean;
  emotionScore: number;
  emotion?: string; // 감정 이모지 필드 추가
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  writingDuration: number;
  reactions: DiaryDetailReactionDto[];
  lat?: number;
  lng?: number;
  userId?: string; // 소유자 ID 추가
  user?: {
    id: string;
    username: string;
  }; // 소유자 정보 추가
}

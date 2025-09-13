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
  /**
   * @deprecated JournalQuestion 모델 제거로 항상 빈 문자열.
   *  - 프론트에서 더 이상 사용하지 않는다면 추후 제거 예정.
   *  - 호환성 유지 위해 남겨둠.
   */
  question: string; // deprecated: 항상 ''
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
  /**
   * @deprecated JournalQuestion 모델 제거로 항상 빈 문자열.
   *  - 향후 제거 시 프론트 응답 타입에서 삭제 필요.
   */
  question: string; // deprecated
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

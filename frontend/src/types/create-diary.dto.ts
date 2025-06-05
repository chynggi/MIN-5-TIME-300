export interface CreateDiaryDto {
  content: string;
  questionId: string;
  isPublic?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  writingDuration: number;
}

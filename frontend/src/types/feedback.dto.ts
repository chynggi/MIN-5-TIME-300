export interface FeedbackDto {
  content?: string;
  reactionType?: 'like' | 'hug' | 'support';
}

export interface FeedbackResponseDto {
  success: boolean;
  message: string;
  commentId?: string;
  reactionId?: string;
}

import { IsOptional, IsString, IsIn } from 'class-validator';

export class FeedbackDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['like', 'hug', 'support'])
  reactionType?: 'like' | 'hug' | 'support';
}

export class FeedbackResponseDto {
  success: boolean;
  message: string;
  commentId?: string;
  reactionId?: string;
}

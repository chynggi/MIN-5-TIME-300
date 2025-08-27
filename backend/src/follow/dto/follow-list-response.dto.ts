import { FollowResponseDto } from './follow-response.dto';

export class FollowListResponseDto {
  data: FollowResponseDto[];
  hasMore: boolean;
  nextCursor?: string;
}
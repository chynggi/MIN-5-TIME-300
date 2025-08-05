export class SearchUserResponseDto {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
  isFriend?: boolean;
}

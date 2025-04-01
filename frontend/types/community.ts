export interface CommunityEntry {
  id: number;
  userId: string;
  username: string;
  userImage?: string;
  date: string;
  prompt: string;
  content: string;
  emotion: string;
  likes: number;
  comments: number;
  isPublic: boolean;
}

export interface Comment {
  id: number;
  userId: string;
  username: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

export interface Entry {
  id: number;
  username: string;
  userImage?: string;
  date: string;
  prompt: string;
  content: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export interface CommunityResponse {
  entries: Entry[];
  hasMore: boolean;
}

export interface CommunityQueryParams {
  page: number;
  emotion?: string[];
  sortBy: 'latest' | 'popular' | 'comments';
  search?: string;
}
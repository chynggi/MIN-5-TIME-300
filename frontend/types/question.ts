// 공통 인터페이스 정의
export interface Author {
  name: string;
  avatar: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: number;
  author: Author;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  question_id: number;
  user_id: number;
  author: Author;
  content: string;
  comment: string;  // content와 comment 둘 다 지원
  created_at: string;
  updated_at?: string;
  upvotes: number;
}

export interface Vote {
  id: number;
  question_id: number;
  user_id: number;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface CreateQuestionDto {
  title: string;
  description: string;
  category: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
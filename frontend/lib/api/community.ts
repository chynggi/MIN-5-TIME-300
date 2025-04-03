import { apiClient } from '@/lib/api-client';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  tags?: string[];
}

export interface CommentType {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  postId: string;
}

export interface CommunityListResponse {
  posts: CommunityPost[];
  total: number;
  page: number;
  limit: number;
}

export interface CommunityPostCreateDto {
  title: string;
  content: string;
  tags?: string[];
}

export interface CommunityPostUpdateDto {
  title?: string;
  content?: string;
  tags?: string[];
}

export const communityService = {
  // 게시글 목록 가져오기
  getPosts: async (page = 1, limit = 10): Promise<CommunityListResponse> => {
    const response = await apiClient.get(`/community?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 게시글 상세 정보 가져오기
  getPost: async (id: string): Promise<CommunityPost> => {
    const response = await apiClient.get(`/community/${id}`);
    return response.data;
  },

  // 게시글 생성하기
  createPost: async (postData: CommunityPostCreateDto): Promise<CommunityPost> => {
    const response = await apiClient.post('/community', postData);
    return response.data;
  },

  // 게시글 수정하기
  updatePost: async (id: string, postData: CommunityPostUpdateDto): Promise<CommunityPost> => {
    const response = await apiClient.put(`/community/${id}`, postData);
    return response.data;
  },

  // 게시글 삭제하기
  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/community/${id}`);
  },

  // 게시글에 좋아요 누르기
  likePost: async (id: string): Promise<{ likes: number }> => {
    const response = await apiClient.post(`/community/${id}/like`);
    return response.data;
  },

  // 댓글 가져오기
  getComments: async (postId: string): Promise<CommentType[]> => {
    const response = await apiClient.get(`/community/${postId}/comments`);
    return response.data;
  },

  // 댓글 작성하기
  createComment: async (postId: string, content: string): Promise<CommentType> => {
    const response = await apiClient.post(`/community/${postId}/comments`, { content });
    return response.data;
  },

  // 댓글 삭제하기
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/community/${postId}/comments/${commentId}`);
  },
};
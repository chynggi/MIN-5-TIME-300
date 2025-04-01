import axios from 'axios';
import axiosInstance from '@/lib/axios';
import { handleAPIError } from '@/utils/errorHandler';
import type {
  APIResponse,
  Question,
  Comment,
  Vote,
  CreateQuestionDto
} from '@/types/question';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class QuestionService {
  // 질문 목록 조회
  async getQuestions(params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<APIResponse<Question[]>> {
    try {
      const response = await axiosInstance.get('/recommended-questions', { params });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  }

  // 질문 상세 조회
  async getQuestionById(id: number): Promise<APIResponse<{
    question: Question;
    comments: Comment[];
    userVote: Vote | null;
  }>> {
    try {
      const response = await axiosInstance.get(`/recommended-questions/${id}`);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  }

  // 질문 생성
  async createQuestion(data: CreateQuestionDto): Promise<APIResponse<Question>> {
    try {
      const response = await axiosInstance.post('/recommended-questions', data);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  }

  // 질문에 투표
  async voteQuestion(
    id: number, 
    voteType: 'upvote' | 'downvote'
  ): Promise<APIResponse<{
    action: 'added' | 'removed' | 'changed';
    vote_type: 'upvote' | 'downvote';
    question: Question;
  }>> {
    const response = await axiosInstance.post(`/recommended-questions/${id}/vote`, {
      vote_type: voteType
    });
    return response.data;
  }

  // 댓글 작성
  async createComment(
    questionId: number, 
    comment: string
  ): Promise<APIResponse<Comment>> {
    const response = await axiosInstance.post(
      `/recommended-questions/${questionId}/comments`,
      { comment }
    );
    return response.data;
  }

  // 댓글 목록 조회
  async getComments(questionId: number): Promise<APIResponse<Comment[]>> {
    const response = await axiosInstance.get(
      `/recommended-questions/${questionId}/comments`
    );
    return response.data;
  }
}

export const questionService = new QuestionService();
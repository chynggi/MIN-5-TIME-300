import { apiClient } from '@/lib/api-client';

export interface CategoryInfo {
  id: number;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    profileImage: string;
  };
  category: number;
  categoryInfo?: CategoryInfo;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isResolved: boolean;
  answerCount: number;
}

export interface Answer {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  questionId: string;
  isAccepted: boolean;
  votes: number;
}

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
}

export interface QuestionCreateDto {
  title: string;
  content: string;
  category: number;
  tags?: string[];
}

export interface QuestionUpdateDto {
  title?: string;
  content?: string;
  tags?: string[];
  category?: number;
  isResolved?: boolean;
}

export const questionsService = {
  // 카테고리 목록 가져오기
  getCategories: async (): Promise<CategoryInfo[]> => {
    const response = await apiClient.get('/questions/categories');
    return response.data;
  },

  // 질문 목록 가져오기
  getQuestions: async (
    page = 1, 
    limit = 10, 
    search?: string, 
    tags?: string,
    category?: number,
    filter?: 'all' | 'open' | 'resolved'
  ): Promise<QuestionListResponse> => {
    let url = `/questions?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (tags) {
      url += `&tags=${encodeURIComponent(tags)}`;
    }
    
    if (category !== undefined) {
      url += `&category=${category}`;
    }

    if (filter && filter !== 'all') {
      url += `&filter=${filter}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // 질문 상세 정보 가져오기
  getQuestion: async (id: string): Promise<Question> => {
    const response = await apiClient.get(`/questions/${id}`);
    return response.data;
  },

  // 질문 생성하기
  createQuestion: async (questionData: QuestionCreateDto): Promise<Question> => {
    const response = await apiClient.post('/questions', questionData);
    return response.data;
  },

  // 질문 수정하기
  updateQuestion: async (id: string, questionData: QuestionUpdateDto): Promise<Question> => {
    const response = await apiClient.put(`/questions/${id}`, questionData);
    return response.data;
  },

  // 질문 삭제하기
  deleteQuestion: async (id: string): Promise<void> => {
    await apiClient.delete(`/questions/${id}`);
  },

  // 질문에 대한 답변 가져오기
  getAnswers: async (questionId: string): Promise<Answer[]> => {
    const response = await apiClient.get(`/questions/${questionId}/answers`);
    return response.data;
  },

  // 답변 작성하기
  createAnswer: async (questionId: string, content: string): Promise<Answer> => {
    const response = await apiClient.post(`/questions/${questionId}/answers`, { content });
    return response.data;
  },

  // 답변 채택하기
  acceptAnswer: async (questionId: string, answerId: string): Promise<Answer> => {
    const response = await apiClient.post(`/questions/${questionId}/answers/${answerId}/accept`);
    return response.data;
  },

  // 답변에 투표하기
  voteAnswer: async (questionId: string, answerId: string, value: 1 | -1): Promise<Answer> => {
    const response = await apiClient.post(`/questions/${questionId}/answers/${answerId}/vote`, { value });
    return response.data;
  },
};
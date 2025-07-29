import apiRequest from '../lib/api';

export interface DiaryItem {
  id: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  emotionScore?: number;
  mediaUrl?: string;
  mediaType?: string;
  question?: string;
}

export interface DiaryListResponse {
  diaries: DiaryItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface DiaryDetailResponse {
  id: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  emotionScore?: number;
  mediaUrl?: string;
  mediaType?: string;
  question?: string;
  feedbacks?: any[];
}

export interface TodayQuestionResponse {
  question: string;
  date: string;
}

export const diaryApi = {
  // 일기 목록 조회
  getDiaries: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<DiaryListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `/diaries${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(url);
  },

  // 특정 일기 조회
  getDiary: (id: string): Promise<DiaryDetailResponse> => {
    return apiRequest(`/diaries/${id}`);
  },

  // 오늘의 질문 조회
  getTodayQuestion: (): Promise<TodayQuestionResponse> => {
    return apiRequest('/diaries/today-question');
  },

  // 일기 생성
  createDiary: (data: {
    content: string;
    question?: string;
    isPublic?: boolean;
  }): Promise<DiaryItem> => {
    return apiRequest('/diaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 일기 감정 평가
  rateDiary: (id: string, emotionScore: number): Promise<{ id: string; emotionScore: number; updatedAt: string }> => {
    return apiRequest(`/diaries/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ emotionScore }),
    });
  },

  // 일기 공개/비공개 설정
  shareDiary: (id: string, isPublic: boolean): Promise<{ id: string; isPublic: boolean; updatedAt: string }> => {
    return apiRequest(`/diaries/${id}/share`, {
      method: 'PUT',
      body: JSON.stringify({ isPublic }),
    });
  },
};

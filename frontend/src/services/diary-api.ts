import apiRequest from '../lib/api';
import type { DiarySelectedQuestion } from '@/types/diary';

export interface DiaryItem {
  id: string;
  content: string;
  createdAt: string;
  diaryDate?: string; // 일기 날짜
  isRetrospective?: boolean; // 회고 작성 여부
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
  diaryDate?: string;
  isRetrospective?: boolean;
  isPublic: boolean;
  emotionScore?: number;
  mediaUrl?: string;
  mediaType?: string;
  question?: string;
  feedbacks?: any[];
  selectedQuestions?: DiarySelectedQuestion[];
}

// 신규 다중 질문 응답 스키마
export interface GeneratedQuestionItem {
  domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal';
  text: string;
}

export interface GeneratedQuestionsResponse {
  questions: GeneratedQuestionItem[]; // 정확히 5개 기대
  modelUsed?: string; // 백엔드 확장 가능성
  fallbackUsed?: boolean;
}

export interface TodayQuestionsResponse {
  date: string;
  questions: GeneratedQuestionItem[]; // 오늘의 질문 세트 (5개)
}

export interface SaveAnswersPayloadItem {
  domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal';
  question: string;
  answer: string;
}
export interface SaveAnswersResponse {
  id: string;
  content: string; // 요약 결과(미리보기)
  diaryDate: string;
  isPublic: boolean;
  summary?: { modelUsed?: string; truncated?: boolean; fallbackUsed?: boolean };
  selectedQuestions: DiarySelectedQuestion[];
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

  // 오늘의 질문 세트 조회 (백엔드 엔드포인트가 변경되면 경로 갱신)
  getTodayQuestions: (): Promise<TodayQuestionsResponse> => {
    return apiRequest('/diaries/today-questions');
  },

  // 질문 세트 생성 (AI 직접 호출용) - 기존 /questions/generate 대체 예상
  generateQuestions: (model?: string, date?: string): Promise<GeneratedQuestionsResponse> => {
    const url = model ? `/questions/generate?model=${encodeURIComponent(model)}` : '/questions/generate';
    return apiRequest(url, { 
      method: 'POST',
      body: date ? JSON.stringify({ date }) : undefined
    });
  },

  // 오늘 작성된 맞팔 친구들의 공개 일기 목록
  getFriendsTodayDiaries: (): Promise<{ items: { diaryId: string; userId: string; username: string; profileImageUrl?: string; emotion?: string | null; createdAt: string }[] }> => {
    return apiRequest('/diaries/friends/today');
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

  // 질문 답변 저장 + 즉시 요약 생성
  saveAnswers: (data: { qa: SaveAnswersPayloadItem[]; modelId?: string; diaryDate?: string }): Promise<SaveAnswersResponse> => {
    return apiRequest('/diaries/save-answers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

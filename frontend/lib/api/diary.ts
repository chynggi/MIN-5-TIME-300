import { apiClient } from '@/lib/api-client';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
}

export interface DiaryListResponse {
  diaries: DiaryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface DiaryCreateDto {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface DiaryUpdateDto {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}

export const diaryService = {
  // 일기 목록 가져오기
  getDiaries: async (page = 1, limit = 10): Promise<DiaryListResponse> => {
    const response = await apiClient.get(`/diaries?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 일기 상세 정보 가져오기
  getDiary: async (id: string): Promise<DiaryEntry> => {
    const response = await apiClient.get(`/diaries/${id}`);
    return response.data;
  },

  // 일기 생성하기
  createDiary: async (diaryData: DiaryCreateDto): Promise<DiaryEntry> => {
    const response = await apiClient.post('/diaries', diaryData);
    return response.data;
  },

  // 일기 수정하기
  updateDiary: async (id: string, diaryData: DiaryUpdateDto): Promise<DiaryEntry> => {
    const response = await apiClient.put(`/diaries/${id}`, diaryData);
    return response.data;
  },

  // 일기 삭제하기
  deleteDiary: async (id: string): Promise<void> => {
    await apiClient.delete(`/diaries/${id}`);
  },
};
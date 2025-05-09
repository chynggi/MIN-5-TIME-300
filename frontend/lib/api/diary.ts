import { apiClient } from "@/lib/api-client";
import { DiaryEntry } from "@/lib/types";

// 공유된 다이어리 가져오기
export const getSharedDiaries = async (): Promise<DiaryEntry[]> => {
  const response = await apiClient.get(`/diaries/shared`);
  return response.data;
};

export const diaryService = {
  getSharedDiaries,
  getDiaries: async (filter: string): Promise<DiaryEntry[]> => {
    const response = await apiClient.get(`/diaries`, { params: { filter } });
    return response.data;
  },
  createDiary: async (data: { title: string; content: string; mood: string; isPrivate: boolean }): Promise<DiaryEntry> => {
    const response = await apiClient.post(`/diaries`, data);
    return response.data;
  },
  updateDiary: async (id: number, data: { title: string; content: string; mood: string; isPrivate: boolean }): Promise<DiaryEntry> => {
    const response = await apiClient.put(`/diaries/${id}`, data);
    return response.data;
  },
  getDiary: async (id: number): Promise<DiaryEntry> => {
    const response = await apiClient.get(`/diaries/${id}`);
    return response.data;
  },
  deleteDiary: async (id: number): Promise<void> => {
    await apiClient.delete(`/diaries/${id}`);
  },
  addFriend: async (data: { name: string }): Promise<void> => {
    await apiClient.post(`/friends`, data);
  },
  deleteFriend: async (id: number): Promise<void> => {
    await apiClient.delete(`/friends/${id}`);
  }
};

export type { DiaryEntry };
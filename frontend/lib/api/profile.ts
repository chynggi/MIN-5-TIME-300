import { apiClient } from '../api-client';

// 백엔드의 User 스키마와 일치하는 타입 정의
export type ProfileData = {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
  mbti: string | null;
  createdAt: string;
  updatedAt: string;
  // 추가 필드 - 백엔드에서 연산하여 제공
  stats?: {
    diaryCount: number;
    friendCount: number;
    likeCount: number;
  };
  bio?: string;
};

export const profileService = {
  // 사용자 프로필 가져오기 (백엔드 UsersController의 getProfile 엔드포인트 사용)
  getProfile: async (): Promise<ProfileData> => {
    try {
      const { data } = await apiClient.get('/user/profile');
      
      // 통계 필드 추가 (백엔드에서 아직 제공하지 않으므로 하드코딩)
      return {
        ...data,
        stats: {
          diaryCount: 0,
          friendCount: 0,
          likeCount: 0
        }
      };
    } catch (error) {
      console.error('프로필 정보 가져오기 실패:', error);
      throw error;
    }
  },

  // 프로필 정보 업데이트 (백엔드 UsersController의 update 엔드포인트 사용)
  updateProfile: async (profileData: Partial<ProfileData>): Promise<ProfileData> => {
    const { data } = await apiClient.put('/user/profile', profileData);
    return data;
  },

  // 프로필 이미지 업로드 (백엔드 UsersController의 uploadProfileImage 엔드포인트 사용)
  uploadProfileImage: async (file: File): Promise<{ profileImage: string }> => {
    const formData = new FormData();
    formData.append('file', file); // 백엔드의 필드명 'file'과 일치
    
    const { data } = await apiClient.post('/user/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  }
};
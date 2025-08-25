import apiRequest from '../lib/api';
import {
  ProfileResponse,
  UpdateProfileData,
  UpdateInterestsData,
  LifestyleAnswerData,
  PersonaAndGoals,
} from '../types/api';

export const profileApi = {
  // 프로필 조회
  getProfile: (): Promise<ProfileResponse> => {
    return apiRequest('/profile');
  },

  // 프로필 업데이트
  updateProfile: (data: UpdateProfileData): Promise<ProfileResponse> => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 관심사 업데이트
  updateInterests: (data: UpdateInterestsData): Promise<{ success: boolean; interests: any[] }> => {
    return apiRequest('/profile/interests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 라이프스타일 업데이트
  updateLifestyle: (data: LifestyleAnswerData): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/profile/lifestyle', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 라이프스타일 답변
  answerLifestyle: (data: LifestyleAnswerData): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/profile/lifestyle', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 페르소나 조회
  getPersona: (): Promise<PersonaAndGoals> => {
    return apiRequest('/profile/persona');
  },

  // 페르소나 생성
  generatePersona: (): Promise<PersonaAndGoals> => {
    return apiRequest('/profile/persona', {
      method: 'POST',
    });
  },

  // 프로필 이미지 업로드
  uploadProfileImage: (formData: FormData): Promise<{ success: boolean; profileImageUrl: string }> => {
    return apiRequest('/profile/upload-image', {
      method: 'POST',
      body: formData,
    });
  },

  // 프로필 이미지 삭제
  deleteProfileImage: (): Promise<{ success: boolean }> => {
    return apiRequest('/profile/image', {
      method: 'DELETE',
    });
  },
};

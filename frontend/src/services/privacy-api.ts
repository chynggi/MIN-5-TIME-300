import { DetailedPrivacyDto, PrivacySettingsResponseDto } from '../types/privacy-settings.dto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class PrivacyApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 상세 개인정보 설정 조회
  async getDetailedPrivacySettings(): Promise<PrivacySettingsResponseDto> {
    return this.request<PrivacySettingsResponseDto>('/profile/privacy/detailed');
  }

  // 상세 개인정보 설정 업데이트
  async updateDetailedPrivacySettings(settings: DetailedPrivacyDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/profile/privacy/detailed', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // 사용자 차단
  async blockUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/profile/privacy/block', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  // 사용자 차단 해제
  async unblockUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/profile/privacy/unblock/${targetUserId}`, {
      method: 'DELETE',
    });
  }

  // 차단된 사용자 목록 조회
  async getBlockedUsers(): Promise<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }> {
    return this.request<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }>('/profile/privacy/blocked');
  }
}

export const privacyApi = new PrivacyApiService();
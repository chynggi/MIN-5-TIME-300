import { DetailedPrivacyDto, PrivacySettingsResponseDto } from '../types/privacy-settings.dto';

const API_BASE_URL = (() => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  if (url.includes('cafe24.com')) {
    // cafe24 환경에서는 /api/api 형태로 구성 (의도된 구조)
    if (!url.includes('/api/api')) {
      if (url.endsWith('/api')) {
        url = url + '/api';
      } else {
        url = url.replace(/\/$/, '') + '/api/api';
      }
    }
  }
  return url;
})();

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
    // 백엔드 실제 엔드포인트: POST /api/v1/profile/block
    return this.request<{ success: boolean; message: string }>('/profile/block', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  // 사용자 차단 해제
  async unblockUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    // 백엔드 실제 엔드포인트: DELETE /api/v1/profile/block/:targetUserId
    return this.request<{ success: boolean; message: string }>(`/profile/block/${targetUserId}`, {
      method: 'DELETE',
    });
  }

  // 차단된 사용자 목록 조회
  async getBlockedUsers(): Promise<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }> {
    // 백엔드 실제 엔드포인트: GET /api/v1/profile/blocked-users
    return this.request<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }>('/profile/blocked-users');
  }

  // === 활동지수(activity) 설정 ===
  // 공개 여부 조회
  async getActivitySettings(): Promise<{ activityPublic: boolean; lastResetAt?: string }> {
    return this.request<{ activityPublic: boolean; lastResetAt?: string }>('/profile/activity/settings');
  }

  // 공개 여부 업데이트
  async updateActivitySettings(data: { activityPublic: boolean }): Promise<{ success: boolean; activityPublic: boolean }> {
    return this.request<{ success: boolean; activityPublic: boolean }>('/profile/activity/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 활동지수 초기화
  async resetActivity(): Promise<{ success: boolean; message: string; resetAt: string }> {
    return this.request<{ success: boolean; message: string; resetAt: string }>('/profile/activity/reset', {
      method: 'POST',
    });
  }
}

export const privacyApi = new PrivacyApiService();
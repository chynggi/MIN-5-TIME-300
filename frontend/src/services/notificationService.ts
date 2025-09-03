import { 
  Notification, 
  NotificationQuery, 
  NotificationPrefs, 
  DeviceToken, 
  NotificationCounter 
} from '@/types/notification';

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

class NotificationService {
  // NOTE: 백엔드 NotificationController가 @Controller('api/v1/notifications') 로 선언되어 있으므로
  // 여기 baseUrl 또한 /api/v1 로 맞춰야 함. (기존 잘못된 경로: /v1/notifications)
  private baseUrl = `${API_BASE_URL}/api/v1/notifications`;

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 알림 목록 조회
  async getNotifications(query: NotificationQuery = {}): Promise<Notification[]> {
    const searchParams = new URLSearchParams();
    
    if (query.limit) searchParams.append('limit', query.limit.toString());
    if (query.cursor) searchParams.append('cursor', query.cursor);
    if (query.status) searchParams.append('status', query.status);
    if (query.onlyUnread) searchParams.append('onlyUnread', query.onlyUnread.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    return this.makeRequest<Notification[]>(endpoint);
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(): Promise<NotificationCounter> {
    return this.makeRequest<NotificationCounter>('/unread-count');
  }

  // 특정 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<Notification> {
    return this.makeRequest<Notification>(`/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(): Promise<{ count: number }> {
    return this.makeRequest<{ count: number }>('/read-all', {
      method: 'POST',
    });
  }

  // 알림 숨김 처리
  async hideNotification(notificationId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // 알림 설정 조회
  async getPreferences(): Promise<NotificationPrefs> {
    return this.makeRequest<NotificationPrefs>('/preferences');
  }

  // 알림 설정 업데이트
  async updatePreferences(prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    return this.makeRequest<NotificationPrefs>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  }

  // 디바이스 토큰 등록
  async registerDeviceToken(token: DeviceToken): Promise<any> {
    return this.makeRequest('/device-tokens', {
      method: 'POST',
      body: JSON.stringify(token),
    });
  }
}

export const notificationService = new NotificationService();
import apiRequest from '../lib/api';
import {
  NotificationSettings,
  UpdateNotificationSettings,
} from '../types/api';

export const notificationApi = {
  // 알림 설정 조회
  getSettings: (): Promise<NotificationSettings> => {
    return apiRequest('/notification/settings');
  },

  // 알림 설정 업데이트
  updateSettings: (data: UpdateNotificationSettings): Promise<{ success: boolean; settings: NotificationSettings }> => {
    return apiRequest('/notification/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

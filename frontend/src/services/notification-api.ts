import apiRequest from '../lib/api';
import { NotificationSettings, UpdateNotificationSettings } from '../types/api';

// 백엔드 실제 엔드포인트는 /api/v1/notifications/preferences
// 기존 프론트 타입(NotificationSettings)과 백엔드 NotificationPrefsDto 구조가 다르므로 최소 매핑 수행
// 백엔드 prefs: { channelPush, channelInApp, channelEmail, quietHours, types, lang }
// 프론트 요구: messageNotification 등 -> 임시 구현: messageNotification 은 channelInApp 으로 매핑

type RawPrefs = {
  channelPush?: boolean;
  channelInApp?: boolean;
  channelEmail?: boolean;
  quietHours?: any;
  types?: any;
  lang?: string;
};

function mapPrefsToNotificationSettings(raw: RawPrefs): NotificationSettings {
  return {
    reminderEnabled: false, // 서버 미구현 필드 기본값
    reminderTime: '09:00',  // 기본값
    friendRequestNotification: true,
    commentNotification: true,
    reactionNotification: true,
    messageNotification: raw.channelInApp ?? true,
  };
}

export const notificationApi = {
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const raw = await apiRequest('/notifications/preferences');
      return mapPrefsToNotificationSettings(raw as RawPrefs);
    } catch (e) {
      // 실패 시 보수적 기본값 반환
      return mapPrefsToNotificationSettings({});
    }
  },
  updateSettings: async (data: UpdateNotificationSettings): Promise<{ success: boolean; settings: NotificationSettings }> => {
    // messageNotification -> channelInApp만 매핑 저장 (다른 필드는 추후 확장)
    const payload: RawPrefs = {
      channelInApp: data.messageNotification,
    };
    try {
      const updated = await apiRequest('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const mapped = mapPrefsToNotificationSettings(updated as RawPrefs);
      return { success: true, settings: mapped };
    } catch (e) {
      // 서버 미구현/오류 시에도 UI 저장 흐름 진행 가능하도록 fallback
      return { success: false, settings: mapPrefsToNotificationSettings({ channelInApp: data.messageNotification }) };
    }
  },
};

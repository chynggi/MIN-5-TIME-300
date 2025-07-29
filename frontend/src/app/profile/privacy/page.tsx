'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../profile.module.css';
import { notificationApi } from '../../../services/notification-api';

interface PrivacySettings {
  isProfilePublic: boolean;
  allowDM: boolean;
  showOnlineStatus: boolean;
  allowTagging: boolean;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    isProfilePublic: true,
    allowDM: true,
    showOnlineStatus: true,
    allowTagging: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 알림 설정 API를 통해 일부 설정 가져오기
      const notificationSettings = await notificationApi.getSettings();
      setSettings(prev => ({
        ...prev,
        allowDM: notificationSettings.messageNotification,
        // TODO: 프로필 공개 설정 등은 별도 API 필요
      }));
      setLoading(false);
    } catch (err) {
      console.error('설정 로드 실패:', err);
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 알림 설정 업데이트
      await notificationApi.updateSettings({
        messageNotification: settings.allowDM,
      });
      
      // TODO: 프로필 공개 설정 등은 별도 API 호출 필요
      
      router.back();
    } catch (err) {
      console.error('설정 저장 실패:', err);
      alert('설정 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const settingItems = [
    {
      key: 'isProfilePublic' as keyof PrivacySettings,
      title: '프로필 공개',
      description: '다른 사용자가 내 프로필을 볼 수 있습니다',
      icon: '👁️',
      note: '백엔드 구현 대기 중'
    },
    {
      key: 'allowDM' as keyof PrivacySettings,
      title: 'DM 수신 허용',
      description: '다른 사용자로부터 메시지를 받을 수 있습니다',
      icon: '💬',
      note: null
    },
    {
      key: 'showOnlineStatus' as keyof PrivacySettings,
      title: '온라인 상태 표시',
      description: '내가 온라인인지 다른 사용자가 볼 수 있습니다',
      icon: '🟢',
      note: '백엔드 구현 대기 중'
    },
    {
      key: 'allowTagging' as keyof PrivacySettings,
      title: '태그 허용',
      description: '다른 사용자가 나를 태그할 수 있습니다',
      icon: '🏷️',
      note: '백엔드 구현 대기 중'
    }
  ];

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          설정을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>프로필 공개 설정</h1>
      </div>

      <div className={styles.settingsContainer}>
        {settingItems.map((item) => (
          <div key={item.key} className={styles.settingItem}>
            <div className={styles.settingIcon}>{item.icon}</div>
            <div className={styles.settingContent}>
              <div className={styles.settingTitle}>{item.title}</div>
              <div className={styles.settingDesc}>
                {item.description}
                {item.note && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    * {item.note}
                  </div>
                )}
              </div>
            </div>
            <div 
              className={`${styles.toggleSwitch} ${settings[item.key] ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => handleToggle(item.key)}
            >
              <div className={styles.toggleThumb}></div>
            </div>
          </div>
        ))}
      </div>

      <button 
        className={styles.saveButton} 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '설정 저장 중...' : '설정 저장'}
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../profile.module.css';
import { notificationApi } from '../../../services/notification-api';
import { privacyApi } from '../../../services/privacy-api';
import FollowPrivacySettings from '../../../components/FollowPrivacySettings';
import { PrivacySettingsResponseDto, FollowPrivacySettings as FollowPrivacyType } from '../../../types/privacy-settings.dto';

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
  const [detailedSettings, setDetailedSettings] = useState<PrivacySettingsResponseDto | null>(null);
  const [followSettings, setFollowSettings] = useState<FollowPrivacyType>({
    followersVisibility: 'PUBLIC',
    followingVisibility: 'PUBLIC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 기존 알림 설정 로드
      const notificationSettings = await notificationApi.getSettings();
      setSettings(prev => ({
        ...prev,
        allowDM: notificationSettings.messageNotification,
      }));

      // 상세 개인정보 설정 로드
      try {
        const privacySettings = await privacyApi.getDetailedPrivacySettings();
        setDetailedSettings(privacySettings);
        setFollowSettings({
          followersVisibility: privacySettings.followersVisibility,
          followingVisibility: privacySettings.followingVisibility
        });
        setSettings(prev => ({
          ...prev,
          showOnlineStatus: privacySettings.showOnlineStatus,
          allowDM: privacySettings.allowDirectMessages,
        }));
      } catch (privacyError) {
        console.log('상세 개인정보 설정 로드 실패 (아직 구현되지 않을 수 있음):', privacyError);
      }

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

  const handleFollowSettingsChange = (newSettings: FollowPrivacyType) => {
    setFollowSettings(newSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 알림 설정 업데이트
      await notificationApi.updateSettings({
        messageNotification: settings.allowDM,
      });
      
      // 상세 개인정보 설정 업데이트 (팔로우 설정 포함)
      try {
        await privacyApi.updateDetailedPrivacySettings({
          followersVisibility: followSettings.followersVisibility,
          followingVisibility: followSettings.followingVisibility,
          showOnlineStatus: settings.showOnlineStatus,
          allowDirectMessages: settings.allowDM,
        });
      } catch (privacyError) {
        console.log('상세 개인정보 설정 업데이트 실패 (아직 구현되지 않을 수 있음):', privacyError);
      }
      
      alert('설정이 저장되었습니다.');
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
        {/* 팔로우 목록 공개 설정 섹션 */}
        <div style={{ marginBottom: '2rem' }}>
          <FollowPrivacySettings
            initialSettings={followSettings}
            onSettingsChange={handleFollowSettingsChange}
            isLoading={saving}
            className="mb-6"
          />
        </div>

        {/* 기존 설정 항목들 */}
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

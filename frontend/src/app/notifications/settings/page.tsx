'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationPrefs } from '@/types/notification';
import { notificationService } from '@/services/notificationService';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    channelPush: true,
    channelInApp: true,
    channelEmail: false,
    quietHours: {
      tz: 'Asia/Seoul',
      from: '23:00',
      to: '08:00'
    },
    types: {
      follow: true,
      like: true,
      comment: true,
      mention: true,
      diary: true
    },
    lang: 'ko-KR'
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await notificationService.getPreferences();
      setPrefs(data);
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다.');
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);

    try {
      await notificationService.updatePreferences(prefs);
      // 성공 피드백 (선택적으로 토스트나 모달 표시)
    } catch (err) {
      setError('설정 저장에 실패했습니다.');
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateChannelPrefs = (channel: keyof Pick<NotificationPrefs, 'channelPush' | 'channelInApp' | 'channelEmail'>, value: boolean) => {
    setPrefs(prev => ({
      ...prev,
      [channel]: value
    }));
  };

  const updateTypePrefs = (type: keyof NotificationPrefs['types'], value: boolean) => {
    setPrefs(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: value
      }
    }));
  };

  const updateQuietHours = (field: 'from' | 'to', value: string) => {
    setPrefs(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours!,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">설정을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 알림 채널 설정 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 채널</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">앱 내 알림</h3>
                  <p className="text-sm text-gray-500">앱을 사용할 때 알림을 표시합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.channelInApp}
                    onChange={(e) => updateChannelPrefs('channelInApp', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">푸시 알림</h3>
                  <p className="text-sm text-gray-500">앱을 사용하지 않을 때도 알림을 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.channelPush}
                    onChange={(e) => updateChannelPrefs('channelPush', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">이메일 알림</h3>
                  <p className="text-sm text-gray-500">중요한 알림을 이메일로 받습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.channelEmail}
                    onChange={(e) => updateChannelPrefs('channelEmail', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 알림 유형 설정 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 유형</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">팔로우</h3>
                  <p className="text-sm text-gray-500">누군가 나를 팔로우하거나 팔로우 요청을 보낼 때</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.types.follow}
                    onChange={(e) => updateTypePrefs('follow', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">좋아요</h3>
                  <p className="text-sm text-gray-500">내 일기에 좋아요를 받을 때</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.types.like}
                    onChange={(e) => updateTypePrefs('like', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">댓글</h3>
                  <p className="text-sm text-gray-500">내 일기에 댓글이 달릴 때</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.types.comment}
                    onChange={(e) => updateTypePrefs('comment', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">일기 발행</h3>
                  <p className="text-sm text-gray-500">팔로우하는 사람이 새 일기를 작성할 때</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.types.diary}
                    onChange={(e) => updateTypePrefs('diary', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 조용 시간 설정 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">조용 시간</h2>
            <p className="text-sm text-gray-500 mb-4">이 시간대에는 푸시 알림을 받지 않습니다</p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <input
                  type="time"
                  value={prefs.quietHours?.from || '23:00'}
                  onChange={(e) => updateQuietHours('from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                <input
                  type="time"
                  value={prefs.quietHours?.to || '08:00'}
                  onChange={(e) => updateQuietHours('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
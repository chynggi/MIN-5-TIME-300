'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Notification, NotificationStatus, NotificationType } from '@/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    hideNotification 
  } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    // 읽지 않은 알림이면 읽음으로 표시
    if (notification.status === NotificationStatus.UNREAD) {
      await markAsRead(notification.id);
    }

    // 딥링크가 있으면 해당 페이지로 이동
    if (notification.deepLink) {
      router.push(notification.deepLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 클릭 이벤트 버블링 방지
    await hideNotification(notificationId);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FOLLOWED_YOU:
      case NotificationType.FOLLOW_REQUESTED:
      case NotificationType.FOLLOW_APPROVED:
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      case NotificationType.JOURNAL_LIKED:
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case NotificationType.JOURNAL_COMMENTED:
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case NotificationType.DIARY_PUBLISHED:
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return created.toLocaleDateString('ko-KR');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">로그인이 필요합니다</h3>
            <p className="text-gray-500 mb-4">알림을 확인하려면 먼저 로그인해주세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">알림을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          {notifications.some(n => n.status === NotificationStatus.UNREAD) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 알림 목록 */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3-3V9a6 6 0 10-12 0v5l-3 3h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">알림이 없습니다</h3>
              <p className="text-gray-500">새로운 알림이 있으면 여기에 표시됩니다.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                  notification.status === NotificationStatus.UNREAD
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* 아이콘 */}
                  {getNotificationIcon(notification.type)}

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          notification.status === NotificationStatus.UNREAD
                            ? 'font-medium text-gray-900'
                            : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-1 text-sm text-gray-500">{notification.body}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="알림 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* 읽지 않음 표시 */}
                    {notification.status === NotificationStatus.UNREAD && (
                      <div className="mt-2">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

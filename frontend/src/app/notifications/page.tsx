"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

interface Notification {
  id: string;
  type: 'friend_request' | 'comment' | 'like' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // 임시로 API 호출을 주석 처리하고 목업 데이터만 사용
      // const response = await api.get("/notifications");
      // setNotifications(response.data.notifications || []);
      
      // 목업 데이터 사용
      setNotifications([
        {
          id: "1",
          type: "friend_request",
          title: "친구 요청",
          message: "chynggi님이 친구 요청을 보냈습니다.",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          type: "like",
          title: "좋아요",
          message: "davinnny님이 당신의 일기에 좋아요를 눌렀습니다.",
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          type: "system",
          title: "시스템 알림",
          message: "새로운 기능이 업데이트되었습니다!",
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        }
      ]);
    } catch (error) {
      console.error("알림 조회 실패:", error);
      setError("알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // 임시로 API 호출 주석 처리
      // await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // 임시로 API 호출 주석 처리
      // await api.put("/notifications/read-all");
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("전체 알림 읽음 처리 실패:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return '👥';
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'system': return '📢';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">알림</h1>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="max-w-md mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-2 text-4xl">🔔</div>
            <div>새로운 알림이 없습니다</div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  // 알림 타입에 따라 해당 페이지로 이동
                  if (notification.type === 'friend_request') {
                    router.push('/friends');
                  } else if (notification.relatedId) {
                    router.push(`/diary/${notification.relatedId}`);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium text-sm ${
                        notification.isRead ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className={`text-sm ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

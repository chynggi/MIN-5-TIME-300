'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Notification, NotificationCounter, NotificationStatus } from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hideNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await notificationService.getNotifications({ limit: 50 });
      setNotifications(data);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('403')) {
        setError('로그인이 필요합니다.');
      } else if (err.message.includes('500')) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('알림을 불러오는데 실패했습니다.');
      }
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // 읽지 않은 알림 개수 조회
  const refreshUnreadCount = async () => {
    if (!user) return;
    
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err: any) {
      // 인증 실패나 서버 오류 시 조용히 처리 (카운터는 필수가 아니므로)
      console.error('Failed to fetch unread count:', err);
    }
  };

  // 특정 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const updatedNotification = await notificationService.markAsRead(notificationId);
      
      // 로컬 상태 업데이트
      setNotifications((prev: Notification[]) => 
        prev.map((notif: Notification) => 
          notif.id === notificationId 
            ? { ...notif, status: updatedNotification.status }
            : notif
        )
      );
      
      // 읽지 않은 개수 갱신
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      // 로컬 상태 업데이트
      setNotifications((prev: Notification[]) => 
        prev.map((notif: Notification) => ({ ...notif, status: NotificationStatus.READ }))
      );
      
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // 알림 숨김 처리
  const hideNotification = async (notificationId: string) => {
    try {
      await notificationService.hideNotification(notificationId);
      
      // 로컬 상태에서 제거
      const notification = notifications.find((n: Notification) => n.id === notificationId);
      setNotifications((prev: Notification[]) => prev.filter((notif: Notification) => notif.id !== notificationId));
      
      // 읽지 않은 상태였다면 카운터 감소
      if (notification && notification.status === NotificationStatus.UNREAD) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Failed to hide notification:', err);
    }
  };

  // 사용자 로그인 시 초기 데이터 로드
  useEffect(() => {
    if (user) {
      fetchNotifications();
      refreshUnreadCount();
    } else {
      // 로그아웃 시 상태 초기화
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // 실시간 알림 업데이트를 위한 폴링 (추후 WebSocket으로 교체 가능)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30초마다 확인

    return () => clearInterval(interval);
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    hideNotification,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
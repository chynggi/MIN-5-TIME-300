import { useEffect, useRef, useCallback, useState } from 'react';
import { Message } from '@/types/chat';

interface HttpPollingHookProps {
  conversationId?: string;
  onMessageReceived?: (message: Message) => void;
  onMessageRead?: (data: { userId: string; upToMessageId: string }) => void;
  pollingInterval?: number; // ms 단위
}

export const useHttpPolling = ({
  conversationId,
  onMessageReceived,
  onMessageRead,
  pollingInterval = 3000 // 3초마다 폴링
}: HttpPollingHookProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  // API URL 구성
  const getApiUrl = useCallback(() => {
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
  }, []);

  // 인증 헤더 가져오기
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }, []);

  // 새 메시지 폴링
  const pollMessages = useCallback(async () => {
    if (!conversationId || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    try {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams();
      params.append('limit', '10');
      if (lastMessageIdRef.current) {
        params.append('after', lastMessageIdRef.current);
      }

      const response = await fetch(
        `${apiUrl}/v1/chat/conversations/${conversationId}/messages?${params}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newMessages: Message[] = data.messages || [];
        
        // 새 메시지가 있으면 콜백 호출
        newMessages.forEach(message => {
          if (onMessageReceived && message.id !== lastMessageIdRef.current) {
            onMessageReceived(message);
            lastMessageIdRef.current = message.id;
          }
        });
        
        if (!isConnected) {
          setIsConnected(true);
        }
      } else {
        console.error('메시지 폴링 실패:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('HTTP 폴링 오류:', error);
      setIsConnected(false);
    } finally {
      isPollingRef.current = false;
    }
  }, [conversationId, onMessageReceived, getApiUrl, getAuthHeaders, isConnected]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    console.log('HTTP 폴링 시작:', conversationId);
    pollingRef.current = setInterval(pollMessages, pollingInterval);
    
    // 즉시 한 번 실행
    pollMessages();
  }, [pollMessages, pollingInterval, conversationId]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsConnected(false);
    console.log('HTTP 폴링 중지');
  }, []);

  // 메시지 전송 (HTTP POST)
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return false;
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/v1/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content,
            idempotencyKey: `${Date.now()}-${Math.random()}`
          }),
        }
      );

      if (response.ok) {
        const message = await response.json();
        onMessageReceived?.(message);
        return true;
      } else {
        console.error('메시지 전송 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      return false;
    }
  }, [conversationId, getApiUrl, getAuthHeaders, onMessageReceived]);

  // 읽음 처리 (HTTP POST)
  const markAsRead = useCallback(async (upToMessageId: string) => {
    if (!conversationId) return false;
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/v1/chat/conversations/${conversationId}/read`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ upToMessageId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        onMessageRead?.(data);
        return true;
      } else {
        console.error('읽음 처리 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('읽음 처리 오류:', error);
      return false;
    }
  }, [conversationId, getApiUrl, getAuthHeaders, onMessageRead]);

  // conversationId 변경 시 폴링 재시작
  useEffect(() => {
    if (conversationId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [conversationId, startPolling, stopPolling]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isConnected,
    sendMessage,
    markAsRead,
    startPolling,
    stopPolling,
  };
};
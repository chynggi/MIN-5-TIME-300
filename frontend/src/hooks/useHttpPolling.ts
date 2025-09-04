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
  const isActiveRef = useRef(false); // 폴링 활성화 상태 추적

  // API URL 구성
  const getApiUrl = useCallback(() => {
    // versioned base (api/v1)
    return (require('@/lib/baseUrl') as typeof import('@/lib/baseUrl')).API_BASE_V1;
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
    if (!conversationId || isPollingRef.current || !isActiveRef.current) return;
    
    isPollingRef.current = true;
    
    try {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams();
      params.append('limit', '10');
      if (lastMessageIdRef.current) {
        params.append('after', lastMessageIdRef.current);
      }

      const response = await fetch(
        `${apiUrl}/chat/conversations/${conversationId}/messages?${params}`,
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
        
        if (!isConnected && isActiveRef.current) {
          setIsConnected(true);
        }
      } else {
        console.error('메시지 폴링 실패:', response.status);
        if (isActiveRef.current) {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error('HTTP 폴링 오류:', error);
      if (isActiveRef.current) {
        setIsConnected(false);
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [conversationId, onMessageReceived, getApiUrl, getAuthHeaders, isConnected]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (!conversationId) return;
    
    // 이미 활성화된 경우 중복 방지
    if (isActiveRef.current && pollingRef.current) {
      console.log('HTTP 폴링이 이미 실행 중입니다.');
      return;
    }
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    isActiveRef.current = true;
    console.log('HTTP 폴링 시작:', conversationId);
    
    pollingRef.current = setInterval(() => {
      if (isActiveRef.current) {
        pollMessages();
      }
    }, pollingInterval);
    
    // 즉시 한 번 실행
    pollMessages();
  }, [pollMessages, pollingInterval, conversationId]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    isActiveRef.current = false;
    
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
        `${apiUrl}/chat/conversations/${conversationId}/messages`,
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
        `${apiUrl}/chat/conversations/${conversationId}/read`,
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
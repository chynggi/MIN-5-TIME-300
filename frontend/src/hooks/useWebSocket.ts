import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/chat';
import { useHttpPolling } from './useHttpPolling';

interface WebSocketHookProps {
  conversationId?: string;
  onMessageReceived?: (message: Message) => void;
  onMessageRead?: (data: { userId: string; upToMessageId: string }) => void;
  onTyping?: (data: { userId: string; until: number }) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export const useWebSocket = ({
  conversationId,
  onMessageReceived,
  onMessageRead,
  onTyping,
  onUserOnline,
  onUserOffline,
}: WebSocketHookProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Cafe24 환경에서는 즉시 HTTP 폴링 사용
  const isCafe24 = (process.env.NEXT_PUBLIC_API_URL || '').includes('cafe24.com');
  const [useHttpFallback, setUseHttpFallback] = useState(isCafe24);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 2; // 재연결 시도 횟수 줄임
  const hasTriedSocketIORef = useRef(false); // Socket.IO 시도 여부 추적
  
  // HTTP 폴링 대안 훅
  const httpPolling = useHttpPolling({
    conversationId: useHttpFallback ? conversationId : undefined,
    onMessageReceived,
    onMessageRead,
    pollingInterval: 5000, // 5초로 증가
  });

  const connect = useCallback(() => {
    // HTTP 폴링 모드이거나 이미 연결된 경우 중복 연결 방지
    if (useHttpFallback || socketRef.current?.connected) {
      console.log(useHttpFallback ? 'HTTP 폴링 모드 활성화됨' : '이미 Socket.IO에 연결되어 있습니다.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('인증 토큰이 없습니다.');
      // 토큰이 없는 경우 즉시 HTTP 폴링으로 전환
      setUseHttpFallback(true);
      return;
    }

    // Socket.IO 시도 이력 체크 - cafe24에서는 바로 HTTP 폴링 사용
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const isCafe24 = apiUrl.includes('cafe24.com');
    
    if (isCafe24 && hasTriedSocketIORef.current) {
      console.log('Cafe24 환경에서 Socket.IO 재시도 생략. HTTP 폴링 사용.');
      setUseHttpFallback(true);
      return;
    }
    
    if (isCafe24) {
      hasTriedSocketIORef.current = true;
    }
    
    if (isCafe24) {
      // cafe24 환경에서는 /api/api 형태로 구성 (의도된 구조)
      if (!apiUrl.includes('/api/api')) {
        if (apiUrl.endsWith('/api')) {
          apiUrl = apiUrl + '/api';
        } else {
          apiUrl = apiUrl.replace(/\/$/, '') + '/api/api';
        }
      }
    }
    
    console.log('Socket.IO 연결 시도:', `${apiUrl}/chat`);
    
    try {
      // 기존 연결이 있다면 정리
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Cafe24 환경에서는 더 보수적인 설정 사용
      socketRef.current = io(`${apiUrl}/chat`, {
        auth: {
          token: token
        },
        query: {
          token: token
        },
        transports: ['polling'], // 프로덕션에서는 polling만 사용 (WebSocket 문제 회피)
        autoConnect: true,
        reconnection: false, // 자동 재연결 비활성화 (수동 관리)
        timeout: 10000, // 타임아웃 시간 단축
        forceNew: true,
        upgrade: false, // 업그레이드 완전히 비활성화
        rememberUpgrade: false,
        withCredentials: true, // 쿠키 전송 허용
        extraHeaders: {
          'Access-Control-Allow-Origin': '*'
        }
      });

      socketRef.current.on('connect', () => {
        console.log('Socket.IO 연결됨');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // 대화방 입장
        if (conversationId) {
          socketRef.current?.emit('join_conversation', { conversationId });
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket.IO 연결 종료:', reason);
        setIsConnected(false);
        
        // 수동 disconnect가 아닌 경우에만 재연결 로직 실행
        if (reason !== 'io client disconnect') {
          console.log('자동 재연결 시도됩니다...');
        }
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.error('Socket.IO 연결 오류:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        });
        setIsConnected(false);
        
        // 연결 오류 시 즉시 HTTP 폴링으로 전환
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Socket.IO 연결 포기. HTTP 폴링으로 전환합니다.');
          setUseHttpFallback(true);
          
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        } else {
          // 짧은 지연 후 재시도
          setTimeout(() => {
            if (!useHttpFallback && reconnectAttemptsRef.current < maxReconnectAttempts) {
              connect();
            }
          }, 2000);
        }
      });

      // 메시지 이벤트 리스너
      socketRef.current.on('message.created', (message: Message) => {
        onMessageReceived?.(message);
      });

      socketRef.current.on('message.read', (data: { userId: string; upToMessageId: string }) => {
        onMessageRead?.(data);
      });

      socketRef.current.on('typing', (data: { userId: string; until: number }) => {
        onTyping?.(data);
      });

      socketRef.current.on('user.online', (data: { userId: string }) => {
        onUserOnline?.(data.userId);
      });

      socketRef.current.on('user.offline', (data: { userId: string }) => {
        onUserOffline?.(data.userId);
      });

      // 추가 에러 이벤트 핸들러
      socketRef.current.on('error', (error: any) => {
        console.error('Socket.IO 일반 오류:', error);
      });

    } catch (error) {
      console.error('Socket.IO 연결 실패:', error);
      setIsConnected(false);
      
      // 대안 연결 방법 시도 (HTTP 폴링 기반 실시간 통신)
      console.log('Socket.IO 실패. HTTP 폴링 대안을 고려해주세요.');
    }
  }, [conversationId, onMessageReceived, onMessageRead, onTyping, onUserOnline, onUserOffline]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinConversation = useCallback((newConversationId: string) => {
    sendMessage('join_conversation', { conversationId: newConversationId });
  }, [sendMessage]);

  const leaveConversation = useCallback((conversationId: string) => {
    sendMessage('leave_conversation', { conversationId });
  }, [sendMessage]);

  const sendTyping = useCallback((conversationId: string) => {
    sendMessage('typing', { conversationId, until: Date.now() + 3000 });
  }, [sendMessage]);

  // 컴포넌트 unmount시에만 useEffect로 disconnect 호출
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // 초기 연결은 별도 useEffect로 분리
  useEffect(() => {
    // Cafe24 환경이 아닌 경우에만 Socket.IO 시도
    if (!isCafe24) {
      connect();
    } else {
      console.log('Cafe24 환경 감지. HTTP 폴링 모드로 시작합니다.');
    }
  }, []); // 빈 dependency array로 한 번만 실행

  // conversationId 변경 시 재입장
  useEffect(() => {
    if (conversationId && socketRef.current?.connected) {
      joinConversation(conversationId);
    }
  }, [conversationId, joinConversation]);

  return {
    isConnected: useHttpFallback ? httpPolling.isConnected : isConnected,
    sendMessage: useHttpFallback 
      ? (event: string, data: any) => {
          // HTTP 폴링에서는 메시지만 지원
          if (event === 'send_message' && data.content) {
            return httpPolling.sendMessage(data.content);
          }
          return Promise.resolve(false);
        }
      : sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping: useHttpFallback ? () => {} : sendTyping, // HTTP 폴링에서는 타이핑 지원 안함
    disconnect: useHttpFallback ? httpPolling.stopPolling : disconnect,
    isUsingHttpFallback: useHttpFallback,
  };
};
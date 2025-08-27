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
  
  // Socket.IO를 먼저 시도하고, 실패 시에만 HTTP 폴링 사용
  const [useHttpFallback, setUseHttpFallback] = useState(false);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3; // 재연결 시도 횟수 증가
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
      return;
    }

    // Socket.IO 서버 URL 구성
    let apiUrl = process.env.SOCKET_URL || 'http://localhost:3001';
    const isCafe24 = apiUrl.includes('cafe24.com');
    let socketPath = '/socket.io/'; // 기본 경로
    
    if (isCafe24) {
      // cafe24 환경에서는 /api/socket.io/ 경로 사용
      socketPath = '/api/socket.io/';
      // API URL은 기본 도메인 사용 (path로 경로 지정)
      apiUrl = apiUrl.replace(/\/api.*$/, ''); // /api 이후 제거
    }
    
    console.log('Socket.IO 연결 시도:', `${apiUrl}/chat`);
    console.log('Socket.IO 경로:', socketPath);
    
    try {
      // 기존 연결이 있다면 정리
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // 환경에 따른 설정 조정
      socketRef.current = io(`${apiUrl}/chat`, {
        path: socketPath, // Socket.IO 경로 명시적 지정
        auth: {
          token: token
        },
        query: {
          token: token
        },
        transports: isCafe24 ? ['polling'] : ['websocket', 'polling'], // Cafe24에서는 polling만, 그 외는 websocket 우선
        autoConnect: true,
        reconnection: false, // 수동으로 재연결 관리
        timeout: isCafe24 ? 15000 : 10000, // Cafe24에서는 타임아웃 더 길게
        forceNew: true,
        upgrade: !isCafe24, // Cafe24에서는 업그레이드 비활성화
        rememberUpgrade: false,
        withCredentials: true,
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
        
        // 연결 오류 시 재시도 로직
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log(`Socket.IO ${maxReconnectAttempts}회 연결 실패. HTTP 폴링으로 전환합니다.`);
          setUseHttpFallback(true);
          
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        } else {
          // 재시도 전 지연
          const retryDelay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // 지수 백오프: 2s, 4s, 8s
          console.log(`${retryDelay/1000}초 후 Socket.IO 재연결 시도 (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            if (!useHttpFallback && reconnectAttemptsRef.current < maxReconnectAttempts) {
              connect();
            }
          }, retryDelay);
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
    // 모든 환경에서 Socket.IO 먼저 시도
    connect();
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
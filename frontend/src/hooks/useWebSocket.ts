import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/chat';

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // 이미 연결된 경우 중복 연결 방지
    if (socketRef.current?.connected) {
      console.log('이미 Socket.IO에 연결되어 있습니다.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('인증 토큰이 없습니다.');
      return;
    }

    // Socket.IO 서버 URL 구성
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log('Socket.IO 연결 시도:', `${apiUrl}/chat`);
    
    try {
      // 기존 연결이 있다면 정리
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(`${apiUrl}/chat`, {
        auth: {
          token: token
        },
        query: {
          token: token
        },
        transports: ['websocket', 'polling'], // WebSocket을 우선으로 하되 폴백 지원
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
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

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO 연결 오류:', error);
        setIsConnected(false);
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

    } catch (error) {
      console.error('Socket.IO 연결 실패:', error);
      setIsConnected(false);
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
    connect();
  }, []); // 빈 dependency array로 한 번만 실행

  // conversationId 변경 시 재입장
  useEffect(() => {
    if (conversationId && socketRef.current?.connected) {
      joinConversation(conversationId);
    }
  }, [conversationId, joinConversation]);

  return {
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    disconnect,
  };
};
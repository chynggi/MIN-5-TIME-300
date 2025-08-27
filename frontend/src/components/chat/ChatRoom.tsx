'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Message, Conversation, User } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';

interface ChatRoomProps {
  conversationId: string;
  currentUser: User;
}

export default function ChatRoom({ conversationId, currentUser }: ChatRoomProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  // 상대방 정보 가져오기
  const otherUser = conversation?.participants.find(p => p.userId !== currentUser.id)?.user;

  // 메시지 수신 처리
  function handleMessageReceived(newMessage: Message) {
    if (newMessage.conversationId === conversationId) {
      setMessages(prev => {
        // 중복 메시지 방지
        const exists = prev.some(m => m.id === newMessage.id);
        if (!exists) {
          return [newMessage, ...prev];
        }
        return prev;
      });

      // 상대방 메시지인 경우 자동 읽음 처리
      if (newMessage.senderId !== currentUser.id) {
        markAsRead(newMessage.id);
      }
    }
  }

  // 읽음 상태 처리
  function handleMessageRead(data: { userId: string; upToMessageId: string }) {
    if (data.userId !== currentUser.id) {
      setMessages(prev => 
        prev.map(msg => ({
          ...msg,
          deliveryStatus: msg.createdAt <= 
            (prev.find(m => m.id === data.upToMessageId)?.createdAt || '') 
            ? 'READ' : msg.deliveryStatus
        }))
      );
    }
  }

  // 타이핑 상태 처리
  function handleTypingReceived(data: { userId: string; until: number }) {
    if (data.userId !== currentUser.id) {
      setTypingUsers(prev => new Set(prev).add(data.userId));
      
      // 기존 타이핑 타이머 제거
      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }
      
      // 새 타이머 설정
      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        delete typingTimeoutRef.current[data.userId];
      }, data.until - Date.now());
    }
  }

  // WebSocket 연결
  const { isConnected, sendTyping, isUsingHttpFallback } = useWebSocket({
    conversationId,
    onMessageReceived: handleMessageReceived,
    onMessageRead: handleMessageRead,
    onTyping: handleTypingReceived,
  });

  // 연결 상태 안정화를 위한 추가 state
  const [isStableConnected, setIsStableConnected] = useState(false);
  
  // 연결 상태가 안정화될 때까지 대기
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setIsStableConnected(true);
      }, 1000); // 1초 후 안정화된 것으로 간주
      return () => clearTimeout(timer);
    } else {
      setIsStableConnected(false);
    }
  }, [isConnected]);

  // 대화 정보 로드
  const loadConversation = useCallback(async () => {
    try {
      const conversations = await chatService.getConversations();
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setConversation(conv);
      } else {
        setError('대화를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('대화 로드 실패:', err);
      setError('대화 정보를 불러오는데 실패했습니다.');
    }
  }, [conversationId]);

  // 메시지 로드
  const loadMessages = useCallback(async (cursor?: string, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await chatService.getMessages(conversationId, 30, cursor);
      
      setMessages(prev => append ? [...prev, ...response.messages] : response.messages);
      setNextCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);

      // 가장 최근 메시지 읽음 처리
      if (response.messages.length > 0 && !append) {
        const latestMessage = response.messages[0];
        if (latestMessage.senderId !== currentUser.id) {
          markAsRead(latestMessage.id);
        }
      }
    } catch (err) {
      console.error('메시지 로드 실패:', err);
      setError('메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId, currentUser.id]);

  // 더 많은 메시지 로드
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore && nextCursor) {
      loadMessages(nextCursor, true);
    }
  }, [hasMore, loadingMore, nextCursor, loadMessages]);

  // 메시지 전송
  const sendMessage = useCallback(async (content: string, attachments?: any) => {
    if (!content.trim() && !attachments) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      type: attachments ? 'image' : 'text',
      content: content.trim() || undefined,
      attachments,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      deliveryStatus: 'SENT',
      isTemporary: true,
    };

    // 낙관적 UI 업데이트
    setMessages(prev => [tempMessage, ...prev]);

    try {
      const idempotencyKey = `${currentUser.id}-${Date.now()}-${Math.random()}`;
      const sentMessage = await chatService.sendMessage(conversationId, {
        content: content.trim() || undefined,
        type: attachments ? 'image' : 'text',
        attachments,
        idempotencyKey,
      });

      // 임시 메시지를 실제 메시지로 교체
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? sentMessage : msg)
      );
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      // 임시 메시지 제거
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setError('메시지 전송에 실패했습니다.');
    }
  }, [conversationId, currentUser]);

  // 이미지 전송
  const sendImage = useCallback(async (file: File) => {
    try {
      const uploadResult = await chatService.uploadImage(file);
      await sendMessage('', { type: 'image', url: uploadResult.url });
    } catch (err) {
      console.error('이미지 전송 실패:', err);
      setError('이미지 전송에 실패했습니다.');
    }
  }, [sendMessage]);

  // 타이핑 신호 전송
  const handleTyping = useCallback(() => {
    if (isStableConnected) {
      sendTyping(conversationId);
    }
  }, [isStableConnected, sendTyping, conversationId]);

  // 읽음 처리
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await chatService.markMessagesAsRead(conversationId, messageId);
    } catch (err) {
      console.error('읽음 처리 실패:', err);
    }
  }, [conversationId]);

  // 대화방 나가기
  const handleLeaveConversation = useCallback(async () => {
    if (confirm('대화방을 나가시겠습니까? 기존 대화 기록이 삭제됩니다.')) {
      // TODO: 대화방 나가기 API 구현
      router.back();
    }
  }, [router]);

  // 사용자 차단
  const handleBlockUser = useCallback(async () => {
    if (!otherUser) return;
    
    if (confirm(`${otherUser.username}님을 차단하시겠습니까?`)) {
      try {
        // TODO: 사용자 차단 API 호출
        router.back();
      } catch (err) {
        console.error('차단 실패:', err);
        setError('사용자 차단에 실패했습니다.');
      }
    }
  }, [otherUser, router]);

  // 초기 로드
  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [loadConversation, loadMessages]);

  // 스크롤 하단 이동
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, messages.length]);

  // 에러 자동 해제
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <div className="text-gray-500">대화를 불러오는 중...</div>
        <div className="text-xs text-gray-400">
          연결 상태: {isConnected ? '연결됨' : '연결 중...'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <ChatHeader
        user={otherUser}
        onLeave={handleLeaveConversation}
        onBlock={handleBlockUser}
        isConnected={isStableConnected}
      />

      {/* 연결 상태 정보 */}
      {!isStableConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 mx-4 mt-2 rounded">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span>
              {isConnected 
                ? (isUsingHttpFallback 
                    ? 'HTTP 폴링으로 연결됨 (제한된 실시간 기능)' 
                    : '연결 안정화 중...'
                  )
                : '연결 중... 잠시만 기다려주세요.'
              }
            </span>
          </div>
        </div>
      )}

      {/* HTTP 폴링 사용 중 알림 */}
      {isUsingHttpFallback && isStableConnected && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 mx-4 mt-2 rounded">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              HTTP 폴링 모드로 연결되었습니다. 실시간 타이핑 표시는 지원되지 않습니다.
            </span>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      {/* 메시지 목록 */}
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        onLoadMore={loadMoreMessages}
        hasMore={hasMore}
        loadingMore={loadingMore}
        typingUsers={typingUsers}
        otherUser={otherUser}
      />

      <div ref={messagesEndRef} />

      {/* 메시지 입력 */}
      <MessageInput
        onSendMessage={sendMessage}
        onSendImage={sendImage}
        onTyping={handleTyping}
        disabled={!isStableConnected}
      />
    </div>
  );
}
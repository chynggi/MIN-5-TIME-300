'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Conversation } from '@/types/chat';
import { chatService } from '@/services/chatService';

interface ChatListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatList({ isOpen, onClose }: ChatListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('채팅방 목록 로드 실패:', err);
      setError('채팅방 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
    onClose();
  };

  const getOtherUser = (conversation: Conversation) => {
    // 현재 사용자가 아닌 다른 참여자 찾기
    return conversation.participants.find(p => {
      // localStorage에서 현재 사용자 정보 확인
      const token = localStorage.getItem('token');
      if (!token) return true;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return p.userId !== payload.sub && p.userId !== payload.userId;
      } catch {
        return true;
      }
    })?.user;
  };

  const formatLastMessageTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 채팅방 목록 패널 */}
      <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-lg z-50 transform transition-transform duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">채팅</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.455L3 21l2.455-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <p className="text-sm">아직 채팅방이 없습니다.</p>
              <p className="text-xs text-gray-400 mt-1">
                친구 프로필에서 메시지를 보내보세요!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* 프로필 이미지 */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                          {otherUser?.profileImageUrl ? (
                            <Image
                              src={otherUser.profileImageUrl}
                              alt={otherUser.username}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* 온라인 상태 (추후 구현) */}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-gray-400" />
                      </div>

                      {/* 채팅 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            💜 {otherUser?.username || 'Unknown'}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 ml-2">
                              {formatLastMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        {/* 마지막 메시지 */}
                        {conversation.lastMessage ? (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.type === 'image' ? '📷 이미지' : conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1">
                            아직 메시지가 없습니다.
                          </p>
                        )}
                      </div>

                      {/* 읽지 않은 메시지 수 (추후 구현) */}
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <div className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
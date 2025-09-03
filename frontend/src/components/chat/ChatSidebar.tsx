"use client";
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Conversation } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { useRouter } from 'next/navigation';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// 왼쪽에서 슬라이드 인 되는 채팅 사이드바 (채팅방 리스트 전용)
export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!isOpen) return; // 열릴 때만 요청
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
      setError('채팅방 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find(p => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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

  const handleConversationClick = (id: string) => {
    router.push(`/chat/${id}`);
    onClose();
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity z-40 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* 패널 */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-80 max-w-[80%] bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">채팅</h2>
          <button onClick={onClose} aria-label="닫기" className="p-2 rounded hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 flex justify-center"><div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          )}
          {error && !loading && (
            <div className="p-4 text-sm text-red-500">{error}</div>
          )}
          {!loading && !error && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              <p>아직 채팅방이 없습니다.</p>
              <p className="text-xs text-gray-400 mt-1">친구에게 메시지를 보내보세요.</p>
            </div>
          )}
          {!loading && !error && conversations.length > 0 && (
            <ul className="divide-y">
              {conversations.map(c => {
                const other = getOtherUser(c);
                return (
                  <li key={c.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleConversationClick(c.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {other?.profileImageUrl ? (
                          <Image src={other.profileImageUrl} alt={other.username} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 truncate">💜 {other?.username || 'Unknown'}</span>
                          {c.lastMessage && (
                            <span className="text-xs text-gray-500 ml-2">{formatLastMessageTime(c.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        {c.lastMessage ? (
                          <p className="text-xs text-gray-600 truncate mt-1">{c.lastMessage.type === 'image' ? '📷 이미지' : c.lastMessage.content}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">아직 메시지가 없습니다.</p>
                        )}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="bg-purple-500 text-white text-[10px] px-2 py-1 rounded-full min-w-[20px] text-center">{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

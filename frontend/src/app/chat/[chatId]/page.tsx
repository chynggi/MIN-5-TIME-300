'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { AuthContext } from '@/context/AuthContext';

// 서버에서 반환하는 메시지 구조
interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  isRead: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // auth context에서 사용자 정보 가져오기
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || '';
  // 상대 사용자 정보
  const [friend, setFriend] = useState<{id: string; username: string; profileImageUrl?: string}>({id:'', username:'', profileImageUrl: undefined});

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/v1/chatRooms/${chatId}/messages`);
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 채팅방 참여자 정보 조회
  const fetchRoomInfo = async () => {
    try {
      const res = await api.get('/api/v1/chatRooms');
      const room = res.data.chatRooms.find((r: any) => r.id === chatId);
      if (room) {
        const other = room.participants.find((p: any) => p.id !== currentUserId);
        if (other) setFriend(other);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchRoomInfo();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await api.post(`/api/v1/chatRooms/${chatId}/messages`, { content: input });
      setInput('');
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExit = async () => {
    await api.post(`/api/v1/chatRooms/${chatId}/exit`);
    router.push('/friends');
  };

  const handleBlock = async () => {
    if (!friend.id) return;
    await api.post(`/api/v1/users/${friend.id}/block`);
    router.push('/friends');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <button onClick={() => router.back()} className="text-xl">◀</button>
        <div className="flex items-center gap-2">
          <img src={friend.profileImageUrl || '/default-avatar.png'} alt="profile" className="w-8 h-8 rounded-full" />
          <span className="font-semibold">{friend.username}</span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-2xl">⋯</button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 space-y-1">
              <button onClick={handleExit} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
                ❌ <span>나가기</span>
              </button>
              <button onClick={handleBlock} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
                🚫 <span>차단</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end ${msg.sender.id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            {msg.sender.id !== currentUserId && (
              <img
                src={msg.sender.profileImageUrl || '/default-avatar.png'}
                alt={msg.sender.username}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <div className={`${msg.sender.id === currentUserId ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'} px-3 py-2 rounded-lg max-w-xs break-words`}>
              {msg.content}
            </div>
            {msg.sender.id === currentUserId && (
              <img
                src={user?.profileImageUrl || '/default-avatar.png'}
                alt={user?.username}
                className="w-6 h-6 rounded-full ml-2"
              />
            )}
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="flex items-center p-3 bg-white border-t">
        <button className="text-xl mr-2">📷</button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button onClick={handleSend} className="text-xl ml-2">✉️</button>
      </div>
    </div>
  );
}

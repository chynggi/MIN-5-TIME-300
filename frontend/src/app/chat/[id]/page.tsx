'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatRoom from '@/components/chat/ChatRoom';
import { User } from '@/types/chat';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.id as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({
            id: userData.id,
            username: userData.username,
            profileImageUrl: userData.profileImageUrl,
          });
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!currentUser || !conversationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류 발생</h1>
          <p className="text-gray-600 mb-4">채팅방을 불러올 수 없습니다.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatRoom
      conversationId={conversationId}
      currentUser={currentUser}
    />
  );
}
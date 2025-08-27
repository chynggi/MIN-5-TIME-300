'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from '@/types/chat';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  user?: User;
  onLeave: () => void;
  onBlock: () => void;
  isConnected: boolean;
}

export function ChatHeader({ user, onLeave, onBlock, isConnected }: ChatHeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* 뒤로가기 + 사용자 정보 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center space-x-3">
          {/* 프로필 이미지 */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
              {user?.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={user.username}
                  width={40}
                  height={40}
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
            {/* 연결 상태 표시 */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* 사용자명 */}
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center">
              💜 {user?.username || 'Unknown'}
            </h2>
            <p className="text-xs text-gray-500">
              {isConnected ? '온라인' : '오프라인'}
            </p>
          </div>
        </div>
      </div>

      {/* 설정 메뉴 */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* 드롭다운 메뉴 */}
        {showDropdown && (
          <>
            {/* 배경 오버레이 */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* 메뉴 */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLeave();
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <span className="text-red-500">❌</span>
                <span>나가기</span>
              </button>
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onBlock();
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <span className="text-red-500">🚫</span>
                <span>차단</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
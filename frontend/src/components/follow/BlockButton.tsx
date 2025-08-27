'use client';

import { useState } from 'react';
import { followApi } from '../../services/follow-api';

interface BlockButtonProps {
  userId: string;
  username: string;
  isBlocked?: boolean;
  className?: string;
  onBlockChange?: (isBlocked: boolean) => void;
}

export default function BlockButton({ 
  userId, 
  username, 
  isBlocked = false,
  className = '',
  onBlockChange 
}: BlockButtonProps) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [isLoading, setIsLoading] = useState(false);

  const handleBlock = async () => {
    if (!confirm(`${username}님을 차단하시겠습니까? 차단하면 서로의 게시물을 볼 수 없습니다.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await followApi.blockUser(userId);
      setBlocked(true);
      onBlockChange?.(true);
      alert(`${username}님을 차단했습니다.`);
    } catch (error) {
      console.error('차단 실패:', error);
      alert('차단에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!confirm(`${username}님의 차단을 해제하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await followApi.unblockUser(userId);
      setBlocked(false);
      onBlockChange?.(false);
      alert(`${username}님의 차단을 해제했습니다.`);
    } catch (error) {
      console.error('차단 해제 실패:', error);
      alert('차단 해제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={blocked ? handleUnblock : handleBlock}
      disabled={isLoading}
      className={`
        px-3 py-1.5 rounded text-sm font-medium transition-all duration-200
        ${blocked 
          ? 'bg-gray-500 hover:bg-green-500 text-white' 
          : 'bg-red-500 hover:bg-red-600 text-white'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>처리중</span>
        </div>
      ) : (
        blocked ? '차단해제' : '차단'
      )}
    </button>
  );
}
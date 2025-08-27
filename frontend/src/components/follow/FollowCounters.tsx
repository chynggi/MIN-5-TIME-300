'use client';

import { useState, useEffect } from 'react';
import { followApi } from '../../services/follow-api';
import { FollowCountersDto } from '../../types/follow.dto';

interface FollowCountersProps {
  userId: string;
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export default function FollowCounters({ 
  userId, 
  className = '',
  onFollowersClick,
  onFollowingClick
}: FollowCountersProps) {
  const [counters, setCounters] = useState<FollowCountersDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCounters = async () => {
      try {
        const data = await followApi.getFollowCounters(userId);
        setCounters(data);
      } catch (error) {
        console.error('팔로우 카운터 로드 실패:', error);
        // 기본값 설정
        setCounters({
          followersCount: 0,
          followingCount: 0,
          updatedAt: new Date()
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCounters();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`flex space-x-6 ${className}`}>
        <div className="text-center animate-pulse">
          <div className="h-6 w-8 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="text-center animate-pulse">
          <div className="h-6 w-8 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!counters) {
    return null;
  }

  return (
    <div className={`flex space-x-6 ${className}`}>
      <button
        onClick={onFollowersClick}
        className="text-center hover:bg-gray-50 p-2 rounded transition-colors"
        disabled={!onFollowersClick}
      >
        <div className="text-xl font-bold text-gray-900">
          {counters.followersCount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">팔로워</div>
      </button>
      
      <button
        onClick={onFollowingClick}
        className="text-center hover:bg-gray-50 p-2 rounded transition-colors"
        disabled={!onFollowingClick}
      >
        <div className="text-xl font-bold text-gray-900">
          {counters.followingCount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">팔로잉</div>
      </button>
    </div>
  );
}
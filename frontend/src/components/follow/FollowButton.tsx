'use client';

import { useState, useEffect } from 'react';
import { followApi } from '../../services/follow-api';
import { FollowRelationshipDto } from '../../types/follow.dto';

interface FollowButtonProps {
  userId: string;
  username: string;
  className?: string;
  onFollowChange?: (status: string) => void;
}

export default function FollowButton({ 
  userId, 
  username, 
  className = '',
  onFollowChange 
}: FollowButtonProps) {
  const [followStatus, setFollowStatus] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // 팔로우 관계 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const relationship = await followApi.getFollowRelationship(userId);
        setFollowStatus(relationship.status);
      } catch (error) {
        console.error('팔로우 상태 확인 실패:', error);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    checkFollowStatus();
  }, [userId]);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await followApi.followUser(userId);
      setFollowStatus(response.status.toLowerCase());
      onFollowChange?.(response.status.toLowerCase());
    } catch (error) {
      console.error('팔로우 실패:', error);
      alert('팔로우 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!confirm(`${username}님을 언팔로우하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await followApi.unfollowUser(userId);
      setFollowStatus('none');
      onFollowChange?.('none');
    } catch (error) {
      console.error('언팔로우 실패:', error);
      alert('언팔로우에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className={`animate-pulse bg-gray-200 h-8 w-20 rounded ${className}`} />
    );
  }

  const getButtonConfig = () => {
    switch (followStatus) {
      case 'active':
        return {
          text: '팔로잉',
          onClick: handleUnfollow,
          style: 'bg-gray-500 hover:bg-red-500 text-white',
          hoverText: '언팔로우'
        };
      case 'requested':
        return {
          text: '요청됨',
          onClick: handleUnfollow,
          style: 'bg-yellow-500 hover:bg-red-500 text-white',
          hoverText: '취소'
        };
      default:
        return {
          text: '팔로우',
          onClick: handleFollow,
          style: 'bg-blue-500 hover:bg-blue-600 text-white',
          hoverText: '팔로우'
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <button
      onClick={buttonConfig.onClick}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
        ${buttonConfig.style}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      title={buttonConfig.hoverText}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>처리중...</span>
        </div>
      ) : (
        buttonConfig.text
      )}
    </button>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { followApi } from '../../services/follow-api';
import { FollowResponseDto } from '../../types/follow.dto';
import FollowButton from './FollowButton';
import Link from 'next/link';
import Image from 'next/image';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  className?: string;
}

interface UserItem {
  id: string;
  username: string;
  profileImageUrl?: string | null;
}

export default function FollowList({ userId, type, className = '' }: FollowListProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = async (cursor?: string) => {
    try {
      const query = { limit: 20, cursor };
      
      let response;
      if (type === 'followers') {
        response = await followApi.getFollowers(userId, query);
      } else {
        response = await followApi.getFollowing(userId, query);
      }

      const newUsers = response.data.map(item => {
        if (type === 'followers') {
          return item.follower!;
        } else {
          return item.followee!;
        }
      });

      if (cursor) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }

      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error(`${type} 목록 로드 실패:`, error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };

    loadInitialData();
  }, [userId, type]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    
    setLoadingMore(true);
    await loadData(nextCursor);
    setLoadingMore(false);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {type === 'followers' ? '팔로워가' : '팔로잉이'} 없습니다.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${user.id}`}>
                <div className="relative w-12 h-12 cursor-pointer">
                  {user.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt={user.username}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              
              <div>
                <Link href={`/profile/${user.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                    {user.username}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FollowButton 
                userId={user.id} 
                username={user.username}
                className="text-xs px-3 py-1"
              />
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>로딩중...</span>
              </div>
            ) : (
              '더 보기'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
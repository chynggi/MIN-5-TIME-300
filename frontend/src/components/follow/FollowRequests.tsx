'use client';

import { useState, useEffect } from 'react';
import { followApi } from '../../services/follow-api';
import { FollowResponseDto } from '../../types/follow.dto';
import Link from 'next/link';
import Image from 'next/image';

interface FollowRequestsProps {
  className?: string;
}

interface RequestItem {
  id: string;
  followerId: string;
  follower: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
}

export default function FollowRequests({ className = '' }: FollowRequestsProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    try {
      const response = await followApi.getFollowRequests({ limit: 50 });
      setRequests(response.data as RequestItem[]);
    } catch (error) {
      console.error('팔로우 요청 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (followerId: string, username: string) => {
    setProcessingIds(prev => new Set(prev).add(followerId));
    
    try {
      await followApi.approveFollowRequest(followerId);
      setRequests(prev => prev.filter(req => req.followerId !== followerId));
      // 성공 메시지는 선택사항
      console.log(`${username}님의 팔로우 요청을 승인했습니다.`);
    } catch (error) {
      console.error('팔로우 요청 승인 실패:', error);
      alert('팔로우 요청 승인에 실패했습니다.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(followerId);
        return newSet;
      });
    }
  };

  const handleReject = async (followerId: string, username: string) => {
    setProcessingIds(prev => new Set(prev).add(followerId));
    
    try {
      await followApi.rejectFollowRequest(followerId);
      setRequests(prev => prev.filter(req => req.followerId !== followerId));
      console.log(`${username}님의 팔로우 요청을 거절했습니다.`);
    } catch (error) {
      console.error('팔로우 요청 거절 실패:', error);
      alert('팔로우 요청 거절에 실패했습니다.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(followerId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-900">팔로우 요청</h2>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-gray-200 rounded" />
              <div className="w-16 h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">팔로우 요청</h2>
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
          새로운 팔로우 요청이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        팔로우 요청 ({requests.length})
      </h2>
      
      <div className="space-y-3">
        {requests.map((request) => {
          const isProcessing = processingIds.has(request.followerId);
          
          return (
            <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <Link href={`/profile/${request.follower.id}`}>
                  <div className="relative w-12 h-12 cursor-pointer">
                    {request.follower.profileImageUrl ? (
                      <Image
                        src={request.follower.profileImageUrl}
                        alt={request.follower.username}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {request.follower.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div>
                  <Link href={`/profile/${request.follower.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {request.follower.username}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500">팔로우 요청</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(request.followerId, request.follower.username)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? '처리중...' : '승인'}
                </button>
                
                <button
                  onClick={() => handleReject(request.followerId, request.follower.username)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? '처리중...' : '거절'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { followApi } from '@/services/follow-api';

interface FollowRequest {
  id: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  createdAt: string;
}

export default function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadFollowRequests();
  }, []);

  const loadFollowRequests = async () => {
    try {
      setLoading(true);
      const response = await followApi.getFollowRequests();
      setRequests(response.data.map((follow: any) => ({
        id: follow.id,
        user: follow.follower,
        createdAt: follow.createdAt
      })));
    } catch (error) {
      console.error('팔로우 요청 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (followerId: string) => {
    setProcessingId(followerId);
    try {
      await followApi.approveFollowRequest(followerId);
      setRequests(prev => prev.filter(req => req.user.id !== followerId));
      alert('팔로우 요청을 승인했습니다.');
    } catch (error) {
      console.error('팔로우 요청 승인 실패:', error);
      alert('팔로우 요청 승인에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (followerId: string) => {
    setProcessingId(followerId);
    try {
      await followApi.rejectFollowRequest(followerId);
      setRequests(prev => prev.filter(req => req.user.id !== followerId));
      alert('팔로우 요청을 거절했습니다.');
    } catch (error) {
      console.error('팔로우 요청 거절 실패:', error);
      alert('팔로우 요청 거절에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">팔로우 요청</h1>
      
      {requests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">받은 팔로우 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {request.user.profileImageUrl ? (
                    <img 
                      src={request.user.profileImageUrl} 
                      alt={request.user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {request.user.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(request.user.id)}
                  disabled={processingId === request.user.id}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === request.user.id ? '처리중...' : '승인'}
                </button>
                <button
                  onClick={() => handleReject(request.user.id)}
                  disabled={processingId === request.user.id}
                  className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === request.user.id ? '처리중...' : '거절'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
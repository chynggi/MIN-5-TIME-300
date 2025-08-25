import apiRequest from '../lib/api';
import {
  FriendListResponse,
  FriendRequestData,
  FriendRespondData,
} from '../types/api';

export const friendApi = {
  // 친구 목록 조회
  getFriends: (status?: 'pending' | 'accepted' | 'all'): Promise<FriendListResponse> => {
    const queryParam = status ? `?status=${status}` : '';
    return apiRequest(`/friends${queryParam}`);
  },

  // 친구 요청 보내기
  requestFriend: (data: FriendRequestData): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/friends/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 친구 요청 응답
  respondFriend: (id: string, data: FriendRespondData): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/friends/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 팔로우 관련 API
  followUser: (targetUserId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> => {
    return apiRequest('/friends/follow', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  unfollowUser: (targetUserId: string): Promise<{ success: boolean; message: string; isFollowing: boolean }> => {
    return apiRequest(`/friends/follow/${targetUserId}`, {
      method: 'DELETE',
    });
  },

  // 팔로워 목록 조회
  getFollowers: (): Promise<FriendListResponse> => {
    return apiRequest('/friends/followers');
  },

  // 팔로잉 목록 조회
  getFollowing: (): Promise<FriendListResponse> => {
    return apiRequest('/friends/following');
  },

  // 사용자 검색
  searchUsers: (query: string): Promise<{ users: any[] }> => {
    return apiRequest(`/friends/search?query=${encodeURIComponent(query)}`);
  },

  // 친구 추천
  getRecommendations: (): Promise<{ recommendations: any[] }> => {
    return apiRequest('/friends/recommend');
  },
};

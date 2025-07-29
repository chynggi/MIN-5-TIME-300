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
};

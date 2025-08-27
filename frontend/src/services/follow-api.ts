import {
  FollowResponseDto,
  FollowListResponseDto,
  FollowCountersDto,
  FollowListQueryDto,
  FollowRelationshipDto,
  BlockResponseDto,
} from '../types/follow.dto';

const API_BASE_URL = (() => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // 중복 방지를 위한 경로 확인
  if (url.includes('cafe24.com') && !url.includes('/api')) {
    url = url.replace(/\/$/, '') + '/api';
  }
  return url;
})();

class FollowApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // 204 No Content인 경우 빈 객체 반환
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // 팔로우 요청 또는 즉시 팔로우
  async followUser(userId: string): Promise<FollowResponseDto> {
    return this.request<FollowResponseDto>(`/follow/${userId}`, {
      method: 'POST',
    });
  }

  // 언팔로우
  async unfollowUser(userId: string): Promise<void> {
    return this.request<void>(`/follow/${userId}`, {
      method: 'DELETE',
    });
  }

  // 팔로우 요청 승인
  async approveFollowRequest(followerId: string): Promise<FollowResponseDto> {
    return this.request<FollowResponseDto>(`/follow/${followerId}/approve`, {
      method: 'POST',
    });
  }

  // 팔로우 요청 거절
  async rejectFollowRequest(followerId: string): Promise<void> {
    return this.request<void>(`/follow/${followerId}/reject`, {
      method: 'POST',
    });
  }

  // 특정 사용자의 팔로워 목록 조회
  async getFollowers(
    userId: string,
    query: FollowListQueryDto = {}
  ): Promise<FollowListResponseDto> {
    const searchParams = new URLSearchParams();
    if (query.limit) searchParams.append('limit', query.limit.toString());
    if (query.cursor) searchParams.append('cursor', query.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/follow/${userId}/followers${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FollowListResponseDto>(endpoint);
  }

  // 특정 사용자의 팔로잉 목록 조회
  async getFollowing(
    userId: string,
    query: FollowListQueryDto = {}
  ): Promise<FollowListResponseDto> {
    const searchParams = new URLSearchParams();
    if (query.limit) searchParams.append('limit', query.limit.toString());
    if (query.cursor) searchParams.append('cursor', query.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/follow/${userId}/following${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FollowListResponseDto>(endpoint);
  }

  // 받은 팔로우 요청 목록 조회
  async getFollowRequests(
    query: FollowListQueryDto = {}
  ): Promise<FollowListResponseDto> {
    const searchParams = new URLSearchParams();
    if (query.limit) searchParams.append('limit', query.limit.toString());
    if (query.cursor) searchParams.append('cursor', query.cursor);

    const queryString = searchParams.toString();
    const endpoint = `/follow/requests${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FollowListResponseDto>(endpoint);
  }

  // 팔로우 카운터 조회
  async getFollowCounters(userId: string): Promise<FollowCountersDto> {
    return this.request<FollowCountersDto>(`/follow/${userId}/counters`);
  }

  // 팔로우 관계 확인
  async getFollowRelationship(userId: string): Promise<FollowRelationshipDto> {
    return this.request<FollowRelationshipDto>(`/follow/${userId}/relationship`);
  }

  // 사용자 차단
  async blockUser(userId: string): Promise<BlockResponseDto> {
    return this.request<BlockResponseDto>(`/follow/${userId}/block`, {
      method: 'POST',
    });
  }

  // 사용자 차단 해제
  async unblockUser(userId: string): Promise<void> {
    return this.request<void>(`/follow/${userId}/block`, {
      method: 'DELETE',
    });
  }

  // 차단한 사용자 목록 조회
  async getBlockedUsers(): Promise<{ id: string; username: string; profileImageUrl?: string | null; }[]> {
    return this.request<{ id: string; username: string; profileImageUrl?: string | null; }[]>('/follow/blocked');
  }
}

export const followApi = new FollowApiService();
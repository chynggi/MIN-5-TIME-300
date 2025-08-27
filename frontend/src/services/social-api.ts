import api from '@/lib/axios';
import { 
  SocialFriendsResponse, 
  SocialFriendsQuery, 
  UpdateFavoriteRequest 
} from '@/types/social.dto';

export const socialApi = {
  /**
   * 탭별 친구 목록 조회
   */
  getFriends: async (query: SocialFriendsQuery): Promise<SocialFriendsResponse> => {
    const params = new URLSearchParams();
    params.append('tab', query.tab);
    if (query.cursor) params.append('cursor', query.cursor);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.q) params.append('q', query.q);
    
    const response = await api.get(`/social/friends?${params.toString()}`);
    return response.data;
  },

  /**
   * 즐겨찾기 토글
   */
  toggleFavorite: async (followId: string, isFavorite: boolean): Promise<{ success: boolean }> => {
    const response = await api.patch(`/social/follow/${followId}/favorite`, {
      isFavorite
    } as UpdateFavoriteRequest);
    return response.data;
  }
};
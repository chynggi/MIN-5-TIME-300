"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import FriendSearch from "@/components/FriendSearch";

interface FriendUser {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

interface FriendListItem {
  id: string;
  user: FriendUser;
  status: "pending" | "accepted";
  createdAt: string;
  updatedAt: string;
}

interface LastDiary {
  id: string;
  createdAt: string;
  hasPhoto: boolean;
  hasAudio: boolean;
  hasMusic: boolean;
}

interface FriendWithDiary extends FriendListItem {
  lastDiary?: LastDiary;
}

interface RecommendUser {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendWithDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 추천 친구 상태
  const [recommendations, setRecommendations] = useState<RecommendUser[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [errorRecommend, setErrorRecommend] = useState<string | null>(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const router = useRouter();

  const fetchFriends = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 - 수락된 친구 목록만 가져오기
      const response = await api.get("/friends?status=accepted");
      const friendsData = response.data.friends || [];

      // 각 친구의 최근 일기 정보 가져오기
      const friendsWithDiary = await Promise.all(
        friendsData.map(async (friend: FriendListItem) => {
          try {
            // 각 친구의 최근 일기 조회 (API 엔드포인트는 실제 구조에 맞게 조정 필요)
            const diaryResponse = await api.get(`/diary?userId=${friend.user.id}&limit=1&sort=desc`);
            const lastDiary = diaryResponse.data.diaries?.[0];
            
            return {
              ...friend,
              lastDiary: lastDiary ? {
                id: lastDiary.id,
                createdAt: lastDiary.createdAt,
                hasPhoto: !!lastDiary.imageUrl,
                hasAudio: !!lastDiary.audioUrl,
                hasMusic: !!lastDiary.musicUrl
              } : undefined
            };
          } catch (err) {
            // 일기 정보를 가져올 수 없는 경우
            return {
              ...friend,
              lastDiary: undefined
            };
          }
        })
      );
      
      // 최신 일기 작성 시간순으로 정렬
      const sortedFriends = friendsWithDiary.sort((a: FriendWithDiary, b: FriendWithDiary) => {
        if (!a.lastDiary && !b.lastDiary) return 0;
        if (!a.lastDiary) return 1;
        if (!b.lastDiary) return -1;
        return new Date(b.lastDiary.createdAt).getTime() - new Date(a.lastDiary.createdAt).getTime();
      });
      
      setFriends(sortedFriends);
    } catch (err: any) {
      setError("친구 목록을 불러오지 못했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 추천 친구 목록 조회
  const fetchRecommend = async () => {
    setLoadingRecommend(true);
    setErrorRecommend(null);
    try {
      console.log('[FRONTEND] Fetching recommendations...');
      const res = await api.get("/friends/recommend");
      console.log('[FRONTEND] API response:', res.data);
      const recommendationsData = res.data.recommendations || [];
      console.log('[FRONTEND] Recommendations:', recommendationsData);
      setRecommendations(recommendationsData);
    } catch (e: any) {
      console.error('[FRONTEND] Error fetching recommendations:', e);
      setErrorRecommend("추천 친구를 불러오지 못했습니다.");
    } finally {
      setLoadingRecommend(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRecommend(); // 항상 추천 친구 목록을 가져옴
  }, []);

  // 추천 친구 상태 변화 로그
  useEffect(() => {
    console.log('[FRONTEND] Recommendations state changed:', recommendations);
    console.log('[FRONTEND] Loading state:', loadingRecommend);
  }, [recommendations, loadingRecommend]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds} pm`;
  };

  // 친구별 고유 색상 생성 (사용자 ID 기반)
  const getProfileColor = (userId: string) => {
    const colors = [
      "#4ade80", "#818cf8", "#f87171", "#38bdf8", "#f472b6", 
      "#facc15", "#a78bfa", "#fb7185", "#34d399", "#60a5fa"
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  // 친구 요청을 보내는 함수
  const handleDiaryClick = (diaryId: string) => {
    router.push(`/diary/${diaryId}`);
  };

  // 친구 요청을 보내는 함수
  const handleFriendRequest = async (userId: string) => {
    try {
      await api.post('/friends/request', { userId });
      // 요청 후 해당 사용자를 추천 목록에서 제거
      setRecommendations(prev => prev.filter(rec => rec.id !== userId));
      alert('친구 요청을 보냈습니다!');
    } catch (error: any) {
      console.error('친구 요청 실패:', error);
      alert(error.response?.data?.message || '친구 요청에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm">⏰</span>
            </div>
            <h1 className="text-xl font-bold">5MIN</h1>
          </div>
          <FriendSearch />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* 추천 친구 섹션 */}
        {(recommendations.length > 0 || loadingRecommend) && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">추천 친구</h2>
              {!loadingRecommend && (
                <span className="text-sm text-gray-500">{recommendations.length}명</span>
              )}
            </div>
            {loadingRecommend ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">추천 친구를 찾고 있습니다...</div>
              </div>
            ) : errorRecommend ? (
              <div className="text-center text-red-500 py-4">
                {errorRecommend}
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllRecommendations ? recommendations : recommendations.slice(0, 3)).map(rec => (
                <div key={rec.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {rec.profileImageUrl ? (
                        <img 
                          src={rec.profileImageUrl} 
                          alt={rec.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-sm">👤</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{rec.username}</div>
                      <div className="text-xs text-gray-500">{rec.mbti}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFriendRequest(rec.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    친구 요청
                  </button>
                </div>
              ))}
              {recommendations.length > 3 && (
                <button
                  onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                  className="w-full py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAllRecommendations 
                    ? '접기' 
                    : `추천 친구 ${recommendations.length - 3}명 더 보기`
                  }
                </button>
              )}
            </div>
            )}
          </div>
        )}

        {/* 내 친구 섹션 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">내 친구</h2>
              <span className="text-sm text-gray-500">{friends.length}명</span>
            </div>
          </div>
          
          <div className="p-4">
            {friends.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="mb-2">👥</div>
                <div className="text-sm">아직 친구가 없습니다</div>
                <div className="text-xs text-gray-400 mt-1">위의 추천 친구에게 친구 요청을 보내보세요!</div>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3">
                    {/* 프로필 이미지 */}
                    <div className="relative">
                      <button
                        onClick={() => handleProfileClick(friend.user.username)}
                        className="w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform hover:scale-105"
                        style={{ borderColor: getProfileColor(friend.user.id) }}
                      >
                        {friend.user.profileImageUrl ? (
                          <img 
                            src={friend.user.profileImageUrl} 
                            alt={friend.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">👤</span>
                          </div>
                        )}
                      </button>
                      
                      {/* 하트 아이콘 */}
                      <div className="absolute -bottom-1 -left-1 text-red-500">
                        💖
                      </div>
                      
                      {/* 사용자명 */}
                      <div className="absolute -bottom-6 left-0 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {friend.user.username}
                      </div>
                    </div>

                    {/* 말풍선 */}
                    {friend.lastDiary ? (
                      <button
                        onClick={() => handleDiaryClick(friend.lastDiary!.id)}
                        className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between text-white font-medium shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: getProfileColor(friend.user.id) }}
                      >
                        {/* 시간 */}
                        <span className="text-sm font-medium">
                          {formatTime(friend.lastDiary.createdAt)}
                        </span>
                        
                        {/* 아이콘들 */}
                        <div className="flex items-center gap-2">
                          <span 
                            className={`text-lg ${friend.lastDiary.hasPhoto ? "filter-none" : "opacity-50"}`}
                          >
                            📷
                          </span>
                          <span 
                            className={`text-lg ${friend.lastDiary.hasAudio ? "filter-none" : "opacity-50"}`}
                          >
                            🔊
                          </span>
                          <span 
                            className={`text-lg ${friend.lastDiary.hasMusic ? "filter-none" : "opacity-50"}`}
                          >
                            🎧
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="flex-1 rounded-2xl px-4 py-3 bg-gray-100 text-gray-500 text-sm text-center">
                        아직 일기가 없습니다
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

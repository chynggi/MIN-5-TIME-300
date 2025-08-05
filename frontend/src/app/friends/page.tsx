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
      const res = await api.get("/friends/recommend");
      setRecommendations(res.data.recommendations || []);
    } catch (e: any) {
      setErrorRecommend("추천 친구를 불러오지 못했습니다.");
    } finally {
      setLoadingRecommend(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);
  // friends 로드 후, 친구 없으면 추천 목록 조회
  useEffect(() => {
    if (!loading && !error && friends.length === 0) {
      fetchRecommend();
    }
  }, [loading, error, friends]);

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

  const handleDiaryClick = (diaryId: string) => {
    router.push(`/diary/${diaryId}`);
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

  // 친구가 없을 때: 추천 친구 목록 렌더링
  if (friends.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 (추천 친구 페이지용) */}
        <div className="bg-white shadow-sm p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm">⏰</span>
              </div>
              <h1 className="text-xl font-bold">5MIN</h1>
            </div>
            {/* 검색 기능 추가 */}
            <FriendSearch />
          </div>
        </div>
        
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">추천 친구</h2>
          {loadingRecommend ? (
            <div>추천 목록 로딩 중...</div>
          ) : errorRecommend ? (
            <div className="text-red-500">{errorRecommend}</div>
          ) : (
            <ul className="space-y-3">
              {recommendations.map(rec => (
                <li key={rec.id} className="flex items-center justify-between p-3 bg-white rounded shadow">
                  <div className="flex items-center gap-3">
                    <img src={rec.profileImageUrl || '/default-avatar.png'} alt="프로필" className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-semibold">{rec.username}</div>
                      <div className="text-xs text-gray-500">{rec.mbti}</div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await api.post('/friends/request', { userId: rec.id });
                        // 요청 후 버튼 비활성화
                        setRecommendations(rs => rs.filter(r => r.id !== rec.id));
                      } catch (error) {
                        console.error('친구 요청 실패:', error);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    친구 요청
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // 기본 친구 목록 렌더링
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
          {/* 검색 기능 추가 */}
          <FriendSearch />
        </div>
      </div>

      {/* 친구 목록 */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {friends.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            친구가 없습니다.
          </div>
        ) : (
          friends.map((friend) => (
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
              {friend.lastDiary && (
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
              )}
            </div>
          ))
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                📔
              </div>
              <span className="text-xs text-gray-600">Daily</span>
            </button>
            
            <button 
              onClick={() => router.push('/community')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                💬
              </div>
              <span className="text-xs text-gray-600">Community</span>
            </button>
            
            <button className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                👥
              </div>
              <span className="text-xs font-medium">Friends</span>
            </button>
            
            <button 
              onClick={() => router.push('/profile')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                👤
              </div>
              <span className="text-xs text-gray-600">ME</span>
            </button>
            {/* 추천 페이지로 이동 버튼 (친구가 있을 때) */}
            {friends.length > 0 && (
              <button 
                onClick={() => router.push('/friends/recommend')}
                className="px-4 py-2 bg-green-500 text-white rounded ml-4"
              >
                추천 친구 보기
              </button>
            )}
           </div>
         </div>
       </div>
    </div>
  );
}

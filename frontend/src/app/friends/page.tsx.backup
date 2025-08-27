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

  useEffect(() => {
    fetchFriends();
  }, []);

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

  // 일기 클릭 핸들러
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

      <div className="max-w-md mx-auto p-4">
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
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    {/* 프로필 섹션 */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleProfileClick(friend.user.username)}
                        className="relative group"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border-3 transition-all group-hover:scale-105"
                             style={{ borderColor: getProfileColor(friend.user.id) }}>
                          {friend.user.profileImageUrl ? (
                            <img 
                              src={friend.user.profileImageUrl} 
                              alt={friend.user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <span className="text-gray-500 text-2xl">👤</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 온라인 상태 표시 */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                      </button>
                    </div>

                    {/* 사용자 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{friend.user.username}</h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
                          {friend.user.mbti}
                        </span>
                      </div>
                      
                      {/* 최근 활동 */}
                      {friend.lastDiary ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>📝 최근 일기:</span>
                          <span className="font-medium">
                            {formatTime(friend.lastDiary.createdAt)}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            {friend.lastDiary.hasPhoto && <span className="text-blue-500">📷</span>}
                            {friend.lastDiary.hasAudio && <span className="text-green-500">🎤</span>}
                            {friend.lastDiary.hasMusic && <span className="text-purple-500">🎵</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">아직 일기가 없습니다</div>
                      )}
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {friend.lastDiary && (
                        <button
                          onClick={() => handleDiaryClick(friend.lastDiary!.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="최근 일기 보기"
                        >
                          📖
                        </button>
                      )}
                      <button
                        onClick={() => handleProfileClick(friend.user.username)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="프로필 보기"
                      >
                        👤
                      </button>
                    </div>
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

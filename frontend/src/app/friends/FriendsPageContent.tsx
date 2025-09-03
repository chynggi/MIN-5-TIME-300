"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FriendSearch from "@/components/FriendSearch";
import { socialApi } from "@/services/social-api";
import { 
  Tab, 
  FriendWithDiary, 
  SocialFriendsResponse 
} from "@/types/social.dto";
import { useNotifications } from "@/context/NotificationContext";
import { AuthContext } from "@/context/AuthContext";

export default function FriendsPageContent() {
  const [tab, setTab] = useState<Tab>('mutual');
  const [friends, setFriends] = useState<FriendWithDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  // 채팅 리스트 관련 상태/컴포넌트 제거 (전역 보라색 채팅 아이콘 삭제 요구)
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { unreadCount } = useNotifications();
  const { isAuthenticated } = useContext(AuthContext);

  // URL의 탭 파라미터 동기화
  useEffect(() => {
    const urlTab = searchParams.get('tab') as Tab;
    if (urlTab && ['mutual', 'following', 'favorites'].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/friends?${params.toString()}`);
  };

  // 친구 목록 조회
  const fetchFriends = async (resetList = true) => {
    setLoading(true);
    setError("");
    
    try {
      const response: SocialFriendsResponse = await socialApi.getFriends({
        tab,
        cursor: resetList ? undefined : nextCursor || undefined,
        limit: 20
      });
      
      if (resetList) {
        setFriends(response.items);
      } else {
        setFriends(prev => [...prev, ...response.items]);
      }
      
      setNextCursor(response.nextCursor);
      setTotal(response.total);
    } catch (err: any) {
      setError("목록을 불러오지 못했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 목록 새로고침
  useEffect(() => {
    fetchFriends(true);
  }, [tab]);

  // 즐겨찾기 토글
  const toggleFavorite = async (followId: string, currentFavorite: boolean) => {
    try {
      await socialApi.toggleFavorite(followId, !currentFavorite);
      
      // 낙관적 업데이트
      setFriends(prev => prev.map(friend => 
        friend.id === followId 
          ? { ...friend, isFavorite: !currentFavorite }
          : friend
      ));
      
      // 즐겨찾기 탭에서 즐겨찾기 해제 시 목록에서 제거
      if (tab === 'favorites' && currentFavorite) {
        setFriends(prev => prev.filter(friend => friend.id !== followId));
      }
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
      // TODO: 토스트 알림 추가
    }
  };

  // 시간 포맷팅 수정 (오전/오후 구분)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const suffix = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${suffix}`;
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

  // 탭별 빈 상태 메시지
  const getEmptyMessage = () => {
    switch (tab) {
      case 'mutual':
        return {
          icon: "👥",
          title: "아직 맞팔 친구가 없어요",
          subtitle: "팔로우를 받아보세요!"
        };
      case 'following':
        return {
          icon: "👋",
          title: "내가 팔로우 중인 사용자가 없어요",
          subtitle: "새로운 친구를 찾아보세요!"
        };
      case 'favorites':
        return {
          icon: "⭐",
          title: "즐겨찾기한 친구가 없어요",
          subtitle: "자주 보는 친구를 ★로 즐겨찾기 해보세요!"
        };
    }
  };

  if (loading && friends.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error && friends.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const emptyMsg = getEmptyMessage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 전역 보라색 채팅 아이콘 및 ChatList 모달 제거됨 */}

      {/* 헤더 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-end gap-2">
          <FriendSearch />
          {isAuthenticated && (
            <button
              onClick={() => router.push('/notifications')}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="알림"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-3-3V9a6 6 0 10-12 0v5l-3 3h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="max-w-md mx-auto px-4 mt-3">
        <div className="grid grid-cols-3 bg-gray-100 rounded-xl p-1 text-sm">
          {(['mutual', 'following', 'favorites'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`py-2 rounded-lg transition ${
                tab === t 
                  ? 'bg-white shadow font-semibold text-gray-800' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'mutual' ? '친구(맞팔)' : t === 'following' ? '팔로우' : '즐겨찾기'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* 친구 목록 섹션 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {tab === 'mutual' ? '친구(맞팔)' : tab === 'following' ? '팔로우' : '즐겨찾기'}
              </h2>
              <span className="text-sm text-gray-500">{total}명</span>
            </div>
          </div>
          
          <div className="p-4">
            {friends.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="mb-2 text-2xl">{emptyMsg.icon}</div>
                <div className="text-sm font-medium">{emptyMsg.title}</div>
                <div className="text-xs text-gray-400 mt-1">{emptyMsg.subtitle}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    onClick={() => handleProfileClick(friend.user.username)}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {/* 프로필 섹션 */}
                    <div className="flex-shrink-0">
                      <div className="relative group">
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
                      </div>
                    </div>

                    {/* 사용자 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{friend.user.username}</h3>
                        {friend.user.mbti && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
                            {friend.user.mbti}
                          </span>
                        )}
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
                      {/* 메시지 버튼 */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const { chatService } = await import('@/services/chatService');
                            const conversation = await chatService.createOrGetConversation(friend.user.id);
                            router.push(`/chat/${conversation.id}`);
                          } catch (error) {
                            console.error('대화방 생성 실패:', error);
                            alert('메시지를 시작할 수 없습니다. 다시 시도해주세요.');
                          }
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="메시지 보내기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.455L3 21l2.455-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </button>
                      
                      {/* 즐겨찾기 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(friend.id, friend.isFavorite);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          friend.isFavorite 
                            ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="즐겨찾기 토글"
                      >
                        ★
                      </button>
                      
                      {/* 최근 일기 보기 버튼 */}
                      {friend.lastDiary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiaryClick(friend.lastDiary!.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="최근 일기 보기"
                        >
                          <span role="img" aria-label="최근 일기 보기">🔗</span>
                        </button>
                      )}
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
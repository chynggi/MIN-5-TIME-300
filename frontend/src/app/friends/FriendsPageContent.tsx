"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FriendSearch from "@/components/FriendSearch";
import { socialApi } from "@/services/social-api";
import { Tab, FriendWithDiary, SocialFriendsResponse } from "@/types/social.dto";
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
      <div className="ui-page flex items-center justify-center">
        <div className="text-base text-soft">로딩 중...</div>
      </div>
    );
  }

  if (error && friends.length === 0) {
    return (
      <div className="ui-page flex items-center justify-center">
        <div className="text-base" style={{color:'var(--c-danger)'}}>{error}</div>
      </div>
    );
  }

  const emptyMsg = getEmptyMessage();

  return (
    <div className="ui-page">
      {/* 헤더 */}
      <div className="ui-pageHeader">
        <div className="ui-responsive-narrow flex items-center justify-end gap-sm">
          <FriendSearch />
          {isAuthenticated && (
            <button
              onClick={() => router.push('/notifications')}
              className="iconBtn"
              aria-label="알림"
            >
              <svg
                style={{ width:'20px', height:'20px' }}
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
                <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'var(--c-danger)', color:'#fff', fontSize:'10px', lineHeight:1, borderRadius:'999px', minWidth:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="ui-responsive-narrow" style={{ padding:'1rem 1rem .25rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', background:'var(--c-bg-soft)', border:'1px solid var(--c-border)', borderRadius:'14px', padding:'.4rem', gap:'.4rem' }}>
          {(['mutual', 'following', 'favorites'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding:'.55rem .4rem', fontSize:'.7rem' }}
            >
              {t === 'mutual' ? '친구(맞팔)' : t === 'following' ? '팔로우' : '즐겨찾기'}
            </button>
          ))}
        </div>
      </div>

      {/* 친구 목록 패널 */}
      <div className="ui-responsive-narrow" style={{ padding:'1rem' }}>
        <div className="friendListPanel fade-in">
          <div className="friendListPanelHeader">
            <h2 className="friendListPanelTitle">{tab === 'mutual' ? '친구(맞팔)' : tab === 'following' ? '팔로우' : '즐겨찾기'}</h2>
            <span className="friendListPanelMeta">{total}명</span>
          </div>
          <div style={{ padding:'1rem 1.1rem 1.15rem' }}>
            {friends.length === 0 ? (
              <div className="emptyState">
                <div className="emptyIcon">{emptyMsg.icon}</div>
                <div className="emptyTitle">{emptyMsg.title}</div>
                <div className="emptySubtitle">{emptyMsg.subtitle}</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
                {friends.map(friend => (
                  <div
                    key={friend.id}
                    className="friendItem"
                    onClick={() => handleProfileClick(friend.user.username)}
                  >
                    <div className="friendAvatarWrap" style={{ borderColor: getProfileColor(friend.user.id) }}>
                      {friend.user.profileImageUrl ? (
                        <img src={friend.user.profileImageUrl} alt={friend.user.username} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ) : (
                        <span>👤</span>
                      )}
                      <span className="friendStatusDot" />
                    </div>
                    <div className="friendMeta">
                      <div className="friendNameRow">
                        <span className="friendName" title={friend.user.username}>{friend.user.username}</span>
                        {friend.user.mbti && <span className="badge badge-accent">{friend.user.mbti}</span>}
                      </div>
                      {friend.lastDiary ? (
                        <div className="friendActivity">
                          <span style={{ fontWeight:600 }}>📝</span>
                          <span>{formatTime(friend.lastDiary.createdAt)}</span>
                          <span className="inlineIconGroup">
                            {friend.lastDiary.hasPhoto && <span title="사진">📷</span>}
                            {friend.lastDiary.hasAudio && <span title="오디오">🎤</span>}
                            {friend.lastDiary.hasMusic && <span title="음악">🎵</span>}
                          </span>
                        </div>
                      ) : (
                        <div className="friendActivity" style={{ opacity:.6 }}>아직 일기가 없습니다</div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
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
                        className="iconBtn"
                        title="메시지 보내기"
                      >
                        <svg style={{ width:'16px', height:'16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.455L3 21l2.455-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(friend.id, friend.isFavorite); }}
                        className={`iconBtn ${friend.isFavorite ? 'iconBtn-favoriteActive' : ''}`}
                        title="즐겨찾기 토글"
                        aria-pressed={friend.isFavorite}
                      >
                        ★
                      </button>
                      {friend.lastDiary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDiaryClick(friend.lastDiary!.id); }}
                          className="iconBtn iconBtn-accent"
                          title="최근 일기 보기"
                        >
                          🔗
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
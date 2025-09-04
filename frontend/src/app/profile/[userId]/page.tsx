'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from '../profile.module.css';
import api from '@/lib/axios';
import BlockButton from '@/components/follow/BlockButton';
import { followApi } from '@/services/follow-api';
import { chatService } from '@/services/chatService';
import { getRealtimeSocket } from '@/lib/realtimeSocket';

interface UserProfile {
  id: string;
  name: string;
  message: string;
  diaryCount: number;
  followerCount: number;
  followingCount: number;
  lpgScore: number;
  isFollowing: boolean;
  isPublic: boolean;
  mbti?: string;
  canViewCalendar?: boolean; // 달력 조회 권한 추가
  isBlocked?: boolean; // 차단 상태 추가
  followStatus?: 'none' | 'active' | 'requested'; // 팔로우 상태 추가
  profileColor?: string;
}

interface CalendarDay {
  date: number;
  emotion?: string;
  hasEntry: boolean;
  journalId?: string;
}

function buildThemeStyle(profileColor?: string) {
  if (!profileColor) return undefined;
  const isGradient = /gradient\(/i.test(profileColor);
  let accent = profileColor.trim();
  let accentRgb = '99 102 241';
  let accentSoft = 'rgba(0,0,0,0.05)';
  if (!isGradient) {
    const hex = profileColor.replace('#','');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      accentRgb = `${r} ${g} ${b}`;
      const lighten = (c:number)=>Math.min(255, Math.round(c + (255-c)*0.85));
      const lr = lighten(r); const lg = lighten(g); const lb = lighten(b);
      accentSoft = `rgba(${r},${g},${b},0.12)`;
      accent = `linear-gradient(135deg, ${profileColor}, #${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')})`;
    }
  }
  return {
    '--c-accent': isGradient ? 'var(--c-accent)' : profileColor,
    '--c-accent-rgb': accentRgb,
    '--c-accent-soft': isGradient ? 'rgba(255,255,255,0.12)' : accentSoft,
    '--gradient-accent': accent,
  } as React.CSSProperties;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.userId as string; // 실제로 username을 나타냅니다
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);

  // 감정 이모지 매핑
  const emotionEmojis: { [key: string]: string } = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    excited: "🤩",
    calm: "😌",
    tired: "😴",
    stressed: "😰",
    grateful: "🙏"
  };

  // 캘린더 데이터 생성 (타인의 일기 기준)
  const generateCalendarData = async () => {
    if (!profile) return;
    
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript의 month는 0부터 시작하므로 +1
      const daysInMonth = new Date(year, month, 0).getDate();
      const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
      
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDate = today.getDate();
      
      const calendar: CalendarDay[] = [];
      
      // 빈 칸 추가 (이전 달 마지막 날들)
      for (let i = 0; i < firstDayOfWeek; i++) {
        calendar.push({ date: 0, emotion: "", hasEntry: false });
      }
      
      // 타인의 일기 데이터 조회 (새로운 API 사용)
      let userDiaries: any[] = [];
      let canViewCalendar = false;
      
      try {
        const res = await api.get(`/profile/${username}/calendar/${year}/${month}`);
        const data = res.data;
        canViewCalendar = data.canViewCalendar;
        userDiaries = data.journals || [];
      } catch (error) {
        console.error('타인의 일기 달력 조회 실패:', error);
        canViewCalendar = false;
      }
      
      // 현재 달의 날짜들 추가
      for (let date = 1; date <= daysInMonth; date++) {
        const currentDateObj = new Date(year, month - 1, date); // month는 0부터 시작
        const todayObj = new Date(todayYear, todayMonth - 1, todayDate);
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
        
        let emotion = "";
        let hasEntry = false;
        let journalId: string | undefined = undefined;
        
        // 달력 조회 권한이 있는 경우에만 일기 정보 표시
        if (canViewCalendar) {
          // 과거 날짜나 오늘 날짜인 경우
          if (currentDateObj <= todayObj) {
            const diary = userDiaries.find(d => d.date === dateString);
            if (diary) {
              emotion = diary.emotion || "happy";
              hasEntry = true;
              journalId = diary.id;
            }
          }
          // 미래 날짜들 - 자물쇠 표시
          else {
            emotion = "🔒";
            hasEntry = false;
          }
        }
        // 달력 조회 권한이 없는 경우 모든 날짜에 자물쇠 표시
        else {
          emotion = "🔒";
          hasEntry = false;
        }
        
        calendar.push({
          date,
          emotion,
          hasEntry,
          journalId,
        });
      }
      
      setCalendarData(calendar);
    } catch (error) {
      console.error('캘린더 데이터 생성 실패:', error);
    }
  };

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get('/profile');
        setCurrentUser({ username: res.data.username });
        (window as any)._myProfileUserId = res.data.id; // 본인 ID 저장
      } catch (e) {
        console.error('현재 사용자 정보 조회 실패', e);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchProfile = async () => {
      try {
  const res = await api.get(`/profile/${username}`);
        const data = res.data;
        
        // 팔로우 관계 확인
        let followStatus: 'none' | 'active' | 'requested' = 'none';
        try {
          const relationshipRes = await followApi.getFollowRelationship(data.id);
          followStatus = relationshipRes.status;
        } catch (relationshipError) {
          console.log('팔로우 관계 확인 실패:', relationshipError);
          // 기존 isFollowing 값으로 fallback
          followStatus = data.isFollowing ? 'active' : 'none';
        }

        setProfile({
          id: data.id,
          name: data.username,
          message: data.bio || data.introduction || '',
          diaryCount: data.diaryCount,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
          lpgScore: data.lpgScore,
          isFollowing: data.isFollowing,
          isPublic: data.isPublic,
          mbti: data.mbti,
          canViewCalendar: data.canViewCalendar,
          isBlocked: data.isBlocked,
          followStatus: followStatus,
          profileColor: data.profileColor,
        });
      } catch (e) {
        console.error('프로필 조회 실패', e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [/*userId*/ username]);

  useEffect(() => {
    if (profile) {
      generateCalendarData();
    }
  }, [currentDate, profile]);

  // 실시간 소켓 구독: 조회 대상 사용자 프로필 카운터
  useEffect(() => {
    const socket = getRealtimeSocket();
    const targetUserId = profile?.id;
    if (targetUserId) {
      socket.emit('profile.subscribe', { userId: targetUserId });
    }
    socket.on('profile.counters.update', (data: any) => {
      if (!profile) return;
      if (data.userId === profile.id) {
        setProfile(prev => prev ? {
          ...prev,
          followerCount: data.followerCount !== undefined ? data.followerCount : prev.followerCount,
          followingCount: data.followingCount !== undefined ? data.followingCount : prev.followingCount,
          diaryCount: data.diaryCount !== undefined ? data.diaryCount : prev.diaryCount,
        } : prev);
      }
    });
    return () => {
      if (targetUserId) {
        socket.emit('profile.unsubscribe', { userId: targetUserId });
      }
      socket.off('profile.counters.update');
      // 다른 페이지에서도 사용할 수 있으므로 disconnect는 여기서 하지 않음
    };
  }, [profile?.id]);

  const handleStatsClick = (type: 'followers' | 'following') => {
    // 달력 조회 권한이 있을 때만 팔로워/팔로잉 목록 보기 가능
    if (profile?.canViewCalendar) {
      router.push(`/profile/follow-list?tab=${type}&username=${username}`);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    
    // 차단된 상태에서는 팔로우 불가
    if (profile.isBlocked) {
      alert('차단된 사용자입니다.');
      return;
    }
    
    try {
      if (profile.isFollowing || profile.followStatus === 'active') {
        // 언팔로우
        try {
          await followApi.unfollowUser(profile.id);
          setProfile(prev => prev ? { 
            ...prev, 
            isFollowing: false,
            followStatus: 'none',
            followerCount: Math.max(0, prev.followerCount - 1)
          } : prev);
        } catch (unfollowError: any) {
          if (unfollowError.message?.includes('팔로우 관계가 존재하지 않습니다')) {
            // 이미 언팔로우된 상태라면 상태만 업데이트
            setProfile(prev => prev ? { 
              ...prev, 
              isFollowing: false,
              followStatus: 'none',
              followerCount: Math.max(0, prev.followerCount - 1)
            } : prev);
          } else {
            throw unfollowError;
          }
        }
      } else if (profile.followStatus === 'requested') {
        // 요청 취소
        try {
          await followApi.unfollowUser(profile.id);
          setProfile(prev => prev ? { 
            ...prev, 
            followStatus: 'none'
          } : prev);
        } catch (cancelError: any) {
          if (cancelError.message?.includes('팔로우 관계가 존재하지 않습니다')) {
            // 이미 취소된 상태라면 상태만 업데이트
            setProfile(prev => prev ? { 
              ...prev, 
              followStatus: 'none'
            } : prev);
          } else {
            throw cancelError;
          }
        }
      } else {
        // 팔로우 또는 팔로우 요청
        const result = await followApi.followUser(profile.id);
        const newStatus = result.status === 'ACTIVE' ? 'active' : 'requested';
        setProfile(prev => prev ? { 
          ...prev, 
          isFollowing: newStatus === 'active',
          followStatus: newStatus,
          followerCount: newStatus === 'active' ? prev.followerCount + 1 : prev.followerCount
        } : prev);
      }
    } catch (err: any) {
      console.error('팔로우 토글 에러:', err);
      alert(err.message || '작업에 실패했습니다.');
    }
  };

  const getFollowButtonText = () => {
    if (!profile) return '팔로우';
    
    if (profile.isBlocked) return '차단됨';
    
    // followStatus가 우선, 없으면 isFollowing으로 fallback
    if (profile.followStatus === 'active' || (profile.isFollowing && !profile.followStatus)) {
      return '팔로잉';
    } else if (profile.followStatus === 'requested') {
      return '요청됨';
    } else {
      return '팔로우';
    }
  };

  const getFollowButtonStyle = () => {
    if (!profile) return '';
    
    if (profile.isBlocked) return styles.blockedBtn;
    
    // followStatus가 우선, 없으면 isFollowing으로 fallback
    if (profile.followStatus === 'active' || (profile.isFollowing && !profile.followStatus)) {
      return styles.secondary;
    } else if (profile.followStatus === 'requested') {
      return styles.pending;
    } else {
      return '';
    }
  };

  const handleMessageClick = async () => {
    if (!profile) return;
    
    // 토큰 상태 확인
    const token = localStorage.getItem('token');
    console.log('Current token:', token);
    
    if (!token) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      router.push('/auth/login');
      return;
    }
    
    try {
      // 1:1 대화방 생성 또는 기존 대화방 찾기
      const conversation = await chatService.createOrGetConversation(profile.id);
      
      // 채팅 페이지로 이동
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('대화방 생성 실패:', error);
      
      // 401 에러인 경우 로그인 페이지로 리다이렉트
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }
      
      alert('메시지를 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  const renderLoadingOrError = () => {
    if (loading) {
      return <div className={styles.loading}>프로필 로딩 중...</div>;
    }
    if (!profile) {
      return <div className={styles.error}>사용자를 찾을 수 없습니다.</div>;
    }
    return null;
  };

  const followBtnVariant = () => {
    if (!profile) return '';
    if (profile.isBlocked) return 'blocked';
    if (profile.followStatus === 'requested') return 'pending';
    if (profile.followStatus === 'active' || profile.isFollowing) return 'outline';
    return 'primary';
  };

  const followBtnLabel = () => getFollowButtonText();

  const canViewCalendar = !!profile?.canViewCalendar;

  if (loading || !profile) {
    return (
      <div className={styles.container} style={buildThemeStyle(profile?.profileColor)}>
        <div className={styles.simpleStack}>{renderLoadingOrError()}</div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={buildThemeStyle(profile.profileColor)}>
      <div className={styles.simpleStack}>
        {/* 상단 프로필 */}
        <section className={`${styles.panel} ${styles.profileHeader}`} aria-label="사용자 기본 정보">
          <div className={styles.avatarWrapModern} aria-hidden={!profile.mbti}>
            <div className={styles.avatarFallback}>{profile.mbti || '👤'}</div>
            {profile.mbti && <span className={styles.mbtiBadgeModern}>{profile.mbti}</span>}
          </div>
          <div className={styles.basicInfo}>
            <h1 className={styles.nicknameModern}>{profile.name}</h1>
            <p className={styles.bioModern}>{profile.message || '소개가 없습니다.'}</p>
            <div className={styles.statsModern}>
              <div className={styles.statCard} aria-label={`일기 ${profile.diaryCount}개`}>
                <span className={styles.statValue}>{profile.diaryCount}</span>
                <span className={styles.statLabelModern}>DIARIES</span>
              </div>
              <button
                type="button"
                className={styles.statCard}
                disabled={!canViewCalendar}
                aria-label={`팔로워 ${profile.followerCount}명`}
                onClick={() => canViewCalendar && handleStatsClick('followers')}
              >
                <span className={styles.statValue}>{profile.followerCount}</span>
                <span className={styles.statLabelModern}>FOLLOWERS</span>
              </button>
              <button
                type="button"
                className={styles.statCard}
                disabled={!canViewCalendar}
                aria-label={`팔로잉 ${profile.followingCount}명`}
                onClick={() => canViewCalendar && handleStatsClick('following')}
              >
                <span className={styles.statValue}>{profile.followingCount}</span>
                <span className={styles.statLabelModern}>FOLLOWING</span>
              </button>
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={profile.isBlocked}
                className={[
                  styles.actionBtn,
                  followBtnVariant()==='primary' && styles.actionBtnPrimary,
                  followBtnVariant()==='outline' && styles.actionBtnOutline,
                  followBtnVariant()==='pending' && styles.actionBtnPending,
                  followBtnVariant()==='blocked' && styles.actionBtnBlocked,
                ].filter(Boolean).join(' ')}
                aria-label="팔로우 상태 변경"
              >
                {followBtnLabel()}
              </button>
              <button
                type="button"
                onClick={handleMessageClick}
                disabled={profile.isBlocked}
                className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
              >💬 메시지</button>
              <BlockButton
                userId={profile.id}
                username={profile.name}
                isBlocked={profile.isBlocked}
                className={styles.actionBtn}
                onBlockChange={(isBlocked) => setProfile(prev => prev ? { ...prev, isBlocked } : prev)}
              />
            </div>
          </div>
        </section>

        {/* 캘린더 */}
        <section className={styles.calendarPanel} aria-label="사용자 일기 캘린더">
          <header className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.calendarNavBtn}
              aria-label="이전 달"
              disabled={!canViewCalendar}
              onClick={() => canViewCalendar && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >◀</button>
            <h2 className={styles.calendarTitle}>{currentDate.toLocaleDateString('ko-KR',{year:'numeric',month:'long'})}</h2>
            <button
              type="button"
              className={styles.calendarNavBtn}
              aria-label="다음 달"
              disabled={!canViewCalendar}
              onClick={() => canViewCalendar && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >▶</button>
          </header>
          <div className={styles.weekdayRow} aria-hidden="true">
            {['일','월','화','수','목','금','토'].map(d => <div key={d} className={styles.weekdayCell}>{d}</div>)}
          </div>
          <div className={styles.calendarGrid}>
            {calendarData.map((day, index) => {
              if (day.date === 0) {
                return (
                  <div key={index} className={styles.dayCellOuter} aria-hidden="true">
                    <button className={styles.dayBtn} data-empty="true" tabIndex={-1}></button>
                  </div>
                );
              }
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const today = new Date();
              const currentLocalDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(day.date).padStart(2,'0')}`;
              const todayLocalDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
              const isToday = currentLocalDate === todayLocalDate;
              const isFuture = currentLocalDate > todayLocalDate;
              const labelParts: string[] = [];
              labelParts.push(`${day.date}일`);
              if (isToday) labelParts.push('오늘');
              if (day.hasEntry) labelParts.push('일기 작성됨');
              return (
                <div key={index} className={styles.dayCellOuter}>
                  <button
                    type="button"
                    className={styles.dayBtn}
                    data-today={isToday || undefined}
                    data-future={isFuture || undefined}
                    data-has-entry={day.hasEntry || undefined}
                    aria-label={labelParts.join(' ')}
                    aria-disabled={isFuture ? 'true' : undefined}
                    onClick={() => {
                      if (isFuture) return;
                      if (!canViewCalendar) return;
                      if (day.hasEntry && day.journalId) {
                        router.push(`/diary/${day.journalId}`);
                      }
                    }}
                  >
                    <span className={styles.dayDate}>{day.date}</span>
                    {day.emotion && canViewCalendar && (
                      <span className={styles.dayEmoji}>{day.emotion === '🔒' ? '🔒' : emotionEmojis[day.emotion] || '😊'}</span>
                    )}
                    {!canViewCalendar && <span className={styles.dayEmoji}>🔒</span>}
                    {isToday && !day.hasEntry && !isFuture && canViewCalendar && (
                      <span style={{fontSize:'0.5rem',color:'var(--c-accent)'}}>오늘</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {!canViewCalendar && (
            <div className={styles.legendRow} style={{justifyContent:'center'}}>
              <div className={styles.legendItem}>이 사용자의 일기 달력을 볼 권한이 없습니다.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

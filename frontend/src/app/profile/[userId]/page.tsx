'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from '../profile.module.css';
import api from '@/lib/axios';
import BlockButton from '@/components/follow/BlockButton';
import { followApi } from '@/services/follow-api';
import { chatService } from '@/services/chatService';

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
}

interface CalendarDay {
  date: number;
  emotion?: string;
  hasEntry: boolean;
  journalId?: string; // 일기 ID 추가
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

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.profileContainer}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          사용자를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span>{profile.mbti || '👤'}</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>{profile.diaryCount}</div>
            <div className={styles.statLabel}>일기</div>
          </div>
          <div 
            className={styles.stat}
            onClick={() => handleStatsClick('followers')}
            style={{ cursor: profile.canViewCalendar ? 'pointer' : 'default' }}
          >
            <div className={styles.statNum}>{profile.followerCount}</div>
            <div className={styles.statLabel}>팔로워</div>
          </div>
          <div 
            className={styles.stat}
            onClick={() => handleStatsClick('following')}
            style={{ cursor: profile.canViewCalendar ? 'pointer' : 'default' }}
          >
            <div className={styles.statNum}>{profile.followingCount}</div>
            <div className={styles.statLabel}>팔로잉</div>
          </div>
        </div>
      </div>
      <div className={styles.profileName}>{profile.name}</div>
      <div className={styles.profileMsg}>{profile.message}</div>
      <div className={styles.btnRow}>
        <button 
          className={`${styles.btn} ${getFollowButtonStyle()}`}
          onClick={handleFollowToggle}
          disabled={profile.isBlocked}
        >
          {getFollowButtonText()}
        </button>
        <button 
          className={`${styles.btn} ${styles.secondary}`}
          onClick={handleMessageClick}
          disabled={profile.isBlocked}
        >
          메시지
        </button>
        <BlockButton
          userId={profile.id}
          username={profile.name}
          isBlocked={profile.isBlocked}
          onBlockChange={(isBlocked) => {
            setProfile(prev => prev ? { ...prev, isBlocked } : prev);
          }}
        />
      </div>
      
      {/* 캘린더 섹션 */}
      <section style={{
        background: 'linear-gradient(135deg, #fef3c7, #fcd34d)',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        margin: '16px 0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            disabled={!profile.canViewCalendar}
            style={{
              opacity: profile.canViewCalendar ? 1 : 0.5,
              cursor: profile.canViewCalendar ? 'pointer' : 'not-allowed'
            }}
          >
            ◀
          </button>
          <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>
            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </h2>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            disabled={!profile.canViewCalendar}
            style={{
              opacity: profile.canViewCalendar ? 1 : 0.5,
              cursor: profile.canViewCalendar ? 'pointer' : 'not-allowed'
            }}
          >
            ▶
          </button>
        </div>
        
        {/* 요일 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '8px'
            }}>
              {day}
            </div>
          ))}
        </div>
        
        {/* 캘린더 날짜들 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {profile.canViewCalendar ? (
            // 달력 조회 권한이 있는 경우
            calendarData.map((day, index) => {
              if (day.date === 0) {
                return <div key={index} style={{ aspectRatio: '1' }}></div>;
              }

              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const currentDateObj = new Date(year, month, day.date);
              const today = new Date();
              const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              const isPast = currentDateObj < todayObj;
              const isToday = currentDateObj.getTime() === todayObj.getTime();
              const isFuture = currentDateObj > todayObj;
              
              return (
                <div key={index} style={{ aspectRatio: '1' }}>
                  <button
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      transition: 'all 0.2s',
                      border: 'none',
                      cursor: (isFuture || !day.hasEntry) ? 'not-allowed' : 'pointer',
                      backgroundColor: (isFuture || !day.hasEntry)
                        ? '#f3f4f6'
                        : isToday 
                          ? '#dbeafe'
                          : '#ffffff',
                      opacity: (isFuture || !day.hasEntry) ? 0.6 : 1,
                      boxShadow: day.hasEntry ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                      ...(isToday && day.hasEntry && { border: '2px solid #3b82f6' })
                    }}
                    disabled={isFuture || !day.hasEntry}
                    onClick={() => {
                      if (day.hasEntry && !isFuture && day.journalId) {
                        // 일기 상세 페이지로 이동
                        router.push(`/diary/${day.journalId}`);
                      }
                    }}
                  >
                    <span style={{ 
                      fontWeight: (isToday && day.hasEntry) ? 'bold' : 'normal',
                      color: (isToday && day.hasEntry) ? '#2563eb' : 'inherit'
                    }}>
                      {day.date}
                    </span>
                    {day.hasEntry && day.emotion && (
                      <span style={{ fontSize: '18px', lineHeight: 'none' }}>
                        {day.emotion === "🔒" ? day.emotion : emotionEmojis[day.emotion] || '😊'}
                      </span>
                    )}
                    {!day.hasEntry && (
                      <span style={{ fontSize: '18px' }}>🔒</span>
                    )}
                    {isToday && day.hasEntry && currentUser && currentUser.username === username && (
                      <span style={{ fontSize: '10px', color: '#2563eb', marginTop: '4px' }}>오늘</span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            // 달력 조회 권한이 없는 경우 - 자물쇠 표시
            Array.from({length: 42}).map((_, index) => (
              <div key={index} style={{ aspectRatio: '1' }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  opacity: '0.6',
                  cursor: 'not-allowed'
                }}>
                  <span style={{ fontSize: '18px' }}>🔒</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 달력 조회 권한이 없는 경우 메시지 표시 */}
        {!profile.canViewCalendar && (
          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            이 사용자의 일기 달력을 볼 권한이 없습니다.
          </div>
        )}
      </section>

      <div className={styles.iconRow}>
        <span className={`${styles.icon} ${styles.active}`}>📖</span>
        <span className={styles.icon}>💬</span>
        <span className={styles.icon}>👥</span>
        <span className={styles.icon}>🙋‍♂️</span>
      </div>
    </div>
  );
}

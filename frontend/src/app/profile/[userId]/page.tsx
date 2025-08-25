'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from '../profile.module.css';
import api from '@/lib/axios';

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

  const handleFollowToggle = () => {
    if (!profile) return;
    const toggle = async () => {
      try {
        if (profile.isFollowing) {
          await api.delete(`/friends/follow/${profile.id}`);
          // 언팔로우 시 팔로워 수 감소
          setProfile(prev => prev ? { 
            ...prev, 
            isFollowing: false, 
            followerCount: prev.followerCount - 1 
          } : prev);
        } else {
          await api.post('/friends/follow', { targetUserId: profile.id });
          // 팔로우 시 팔로워 수 증가
          setProfile(prev => prev ? { 
            ...prev, 
            isFollowing: true, 
            followerCount: prev.followerCount + 1 
          } : prev);
        }
      } catch (err) {
        console.error('팔로우 토글 에러', err);
        // 에러 발생 시 상태를 원래대로 되돌림
        setProfile(prev => prev ? { 
          ...prev, 
          isFollowing: !prev.isFollowing,
          followerCount: profile.isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
        } : prev);
      }
    };
    toggle();
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
          className={`${styles.btn} ${profile.isFollowing ? styles.secondary : ''}`}
          onClick={handleFollowToggle}
        >
          {profile.isFollowing ? '팔로잉' : '팔로우'}
        </button>
        <button className={`${styles.btn} ${styles.secondary}`}>메시지</button>
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

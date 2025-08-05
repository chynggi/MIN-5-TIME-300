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
}

interface CalendarDay {
  date: number;
  emotion?: string;
  hasEntry: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.userId as string; // 실제로 username을 나타냅니다
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();
      
      const calendar: CalendarDay[] = [];
      
      // 빈 칸 추가 (이전 달 마지막 날들)
      for (let i = 0; i < firstDayOfWeek; i++) {
        calendar.push({ date: 0, emotion: "", hasEntry: false });
      }
      
      // 타인의 일기 데이터 조회
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      let userDiaries: any[] = [];
      try {
        const res = await api.get(`/diaries/user/${profile.id}?startDate=${startDate}&endDate=${endDate}`);
        userDiaries = res.data.diaries || [];
      } catch (error) {
        console.error('타인의 일기 조회 실패:', error);
      }
      
      // 현재 달의 날짜들 추가
      for (let date = 1; date <= daysInMonth; date++) {
        const currentDateObj = new Date(year, month, date);
        const todayObj = new Date(todayYear, todayMonth, todayDate);
        const dateString = currentDateObj.toISOString().split('T')[0];
        
        let emotion = "";
        let hasEntry = false;
        
        // 공개 프로필이고 과거 날짜인 경우만 일기 정보 표시
        if (profile.isPublic && currentDateObj < todayObj) {
          const diary = userDiaries.find(d => d.createdAt.split('T')[0] === dateString);
          if (diary) {
            emotion = diary.emotion || "happy";
            hasEntry = true;
          }
        } 
        // 오늘 날짜
        else if (currentDateObj.getTime() === todayObj.getTime()) {
          if (profile.isPublic) {
            const diary = userDiaries.find(d => d.createdAt.split('T')[0] === dateString);
            if (diary) {
              emotion = diary.emotion || "happy";
              hasEntry = true;
            }
          }
        }
        // 미래 날짜들 - 자물쇠 표시
        else if (currentDateObj > todayObj) {
          emotion = "🔒";
          hasEntry = false;
        }
        
        calendar.push({
          date,
          emotion,
          hasEntry
        });
      }
      
      setCalendarData(calendar);
    } catch (error) {
      console.error('캘린더 데이터 생성 실패:', error);
    }
  };

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
    // 공개 프로필일 때만 팔로워/팔로잉 목록 보기 가능
    if (profile?.isPublic) {
  router.push(`/profile/follow-list?tab=${type}&username=${username}`);
    }
  };

  const handleFollowToggle = () => {
    if (!profile) return;
    const toggle = async () => {
      try {
        if (profile.isFollowing) {
          await api.post(`/friends/${profile.id}/respond`, { accept: false });
          // 팔로잉 해제 시 팔로워 수 감소
          setProfile(prev => prev ? { 
            ...prev, 
            isFollowing: false, 
            followerCount: prev.followerCount - 1 
          } : prev);
        } else {
          await api.post('/friends/request', { userId: profile.id });
          // 팔로우 요청 시 팔로워 수 증가 (즉시 수락된다고 가정)
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

  if (!profile.isPublic) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <span>{profile.mbti || '🔒'}</span>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>***</div>
              <div className={styles.statLabel}>일기</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>***</div>
              <div className={styles.statLabel}>팔로워</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>***</div>
              <div className={styles.statLabel}>팔로잉</div>
            </div>
          </div>
        </div>
        <div className={styles.profileName}>{profile.name}</div>
        <div className={styles.profileMsg}>비공개 프로필입니다.</div>
        <div className={styles.btnRow}>
          <button 
            className={`${styles.btn} ${profile.isFollowing ? styles.secondary : ''}`}
            onClick={handleFollowToggle}
          >
            {profile.isFollowing ? '팔로잉' : '팔로우'}
          </button>
          <button className={`${styles.btn} ${styles.secondary}`}>메시지</button>
        </div>
        
        {/* 캘린더 섹션 (비공개 프로필) */}
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
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
              ◀
            </button>
            <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
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
          
          {/* 캘린더 날짜들 (비공개) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {Array.from({length: 42}).map((_, index) => (
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
            ))}
          </div>
        </section>

        <div className={styles.iconRow}>
          <span className={styles.icon}>🔒</span>
          <span className={styles.icon}>🔒</span>
          <span className={styles.icon}>🔒</span>
          <span className={styles.icon}>🔒</span>
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
            style={{ cursor: profile.isPublic ? 'pointer' : 'default' }}
          >
            <div className={styles.statNum}>{profile.followerCount}</div>
            <div className={styles.statLabel}>팔로워</div>
          </div>
          <div 
            className={styles.stat}
            onClick={() => handleStatsClick('following')}
            style={{ cursor: profile.isPublic ? 'pointer' : 'default' }}
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
      
      {/* 캘린더 섹션 (공개 프로필) */}
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
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
            ◀
          </button>
          <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>
            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
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
          {calendarData.map((day, index) => {
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
                    cursor: isFuture ? 'not-allowed' : (day.hasEntry ? 'pointer' : 'default'),
                    backgroundColor: isFuture 
                      ? '#f3f4f6'
                      : isToday 
                        ? '#dbeafe'
                        : day.hasEntry 
                          ? '#ffffff'
                          : '#fef3c7',
                    opacity: isFuture ? 0.6 : 1,
                    boxShadow: day.hasEntry ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                    ...(isToday && { border: '2px solid #3b82f6' })
                  }}
                  disabled={isFuture}
                  onClick={() => {
                    if (isPast && day.hasEntry) {
                      console.log(`View ${profile.name}'s diary for ${day.date}`);
                    }
                  }}
                >
                  <span style={{ 
                    fontWeight: isToday ? 'bold' : 'normal',
                    color: isToday ? '#2563eb' : 'inherit'
                  }}>
                    {day.date}
                  </span>
                  {day.emotion && (
                    <span style={{ fontSize: '18px', lineHeight: 'none' }}>
                      {day.emotion === "🔒" ? day.emotion : emotionEmojis[day.emotion] || '😊'}
                    </span>
                  )}
                  {isToday && !day.hasEntry && (
                    <span style={{ fontSize: '10px', color: '#2563eb', marginTop: '4px' }}>오늘</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
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

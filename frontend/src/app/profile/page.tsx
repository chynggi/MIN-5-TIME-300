'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { profileApi } from '../../services/profile-api';
import { friendApi } from '../../services/friend-api';
import { diaryApi } from '../../services/diary-api';
import { statisticsApi } from '../../services/statistics-api';
import { ProfileResponse } from '../../types/api';
import { setAuthToken, testConnection } from '../../lib/api';
import { authApi } from '../../services/auth-api';

interface MyProfile {
  name: string;
  message: string;
  diaryCount: number;
  followerCount: number;
  followingCount: number;
  lpgScore: number;
  lpgGrade: string;
  gradeLevel: number;
  heartProgress: number;
  isPublic: boolean;
  mbti: string;
}

interface CalendarDay {
  date: number;
  emotion?: string;
  hasEntry: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile>({
    name: 'Unknown',
    message: 'Happy Day!! 😊',
    diaryCount: 0,
    followerCount: 0,
    followingCount: 0,
    lpgScore: 0,
    lpgGrade: 'Bronze I',
    gradeLevel: 1,
    heartProgress: 0,
    isPublic: true,
    mbti: 'INFJ',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // 캘린더 데이터 생성 (본인의 일기 기준)
  const generateCalendarData = async () => {
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
      
      // 본인의 일기 데이터 조회
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      let myDiaries: any[] = [];
      try {
        const res = await diaryApi.getDiaries({ 
          limit: 100,
          startDate,
          endDate
        });
        myDiaries = res.diaries || [];
      } catch (error) {
        console.error('본인 일기 조회 실패:', error);
      }
      
      // 현재 달의 날짜들 추가
      for (let date = 1; date <= daysInMonth; date++) {
        const currentDateObj = new Date(year, month, date);
        const todayObj = new Date(todayYear, todayMonth, todayDate);
        const dateString = currentDateObj.toISOString().split('T')[0];
        
        let emotion = "";
        let hasEntry = false;
        
        // 오늘 이전 날짜들
        if (currentDateObj < todayObj) {
          const diary = myDiaries.find(d => d.createdAt.split('T')[0] === dateString);
          if (diary) {
            emotion = diary.emotion || "happy";
            hasEntry = true;
          }
        } 
        // 오늘 날짜
        else if (currentDateObj.getTime() === todayObj.getTime()) {
          const diary = myDiaries.find(d => d.createdAt.split('T')[0] === dateString);
          if (diary) {
            emotion = diary.emotion || "happy";
            hasEntry = true;
          }
        }
        // 미래 날짜들 - 자물쇠 표시
        else {
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
    checkConnection();
    loadProfile();
    loadFriendStats();
    loadDiaryStats();
    loadLPGScore();
  }, []);

  useEffect(() => {
    generateCalendarData();
  }, [currentDate]);

  const checkConnection = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
      setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profileData = await profileApi.getProfile();
      setProfile(prev => ({
        ...prev,
        name: profileData.username || 'Unknown',
        mbti: profileData.mbti || 'INFJ',
      }));
    } catch (err: any) {
      console.error('프로필 로드 실패:', err);
      if (err.message?.includes('인증이 필요합니다')) {
        setError('로그인이 필요합니다.');
      } else {
        setError('프로필을 불러오는데 실패했습니다.');
      }
    }
  };

  const loadFriendStats = async () => {
    try {
      const friendsData = await friendApi.getFriends('accepted');
      setProfile(prev => ({
        ...prev,
        followerCount: friendsData.totalCount || 0,
        followingCount: friendsData.totalCount || 0,
      }));
      setLoading(false);
    } catch (err: any) {
      console.error('친구 통계 로드 실패:', err);
      setLoading(false);
    }
  };

  const loadDiaryStats = async () => {
    try {
      const diaryData = await diaryApi.getDiaries({ limit: 1 });
      setProfile(prev => ({
        ...prev,
        diaryCount: diaryData.totalCount || 0,
      }));
    } catch (err: any) {
      console.error('일기 통계 로드 실패:', err);
    }
  };

  const loadLPGScore = async () => {
    try {
      const lpgData = await statisticsApi.getLPGScore();
      setProfile(prev => ({
        ...prev,
        lpgScore: lpgData.lpgScore || 0,
        lpgGrade: lpgData.grade || 'Bronze I',
        gradeLevel: lpgData.gradeLevel || 1,
        heartProgress: lpgData.heartProgress || 0,
      }));
    } catch (err: any) {
      console.error('LPG 점수 로드 실패:', err);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleTogglePublic = () => {
    router.push('/profile/privacy');
  };

  const handleStatsClick = (type: 'followers' | 'following') => {
    router.push(`/profile/follow-list?tab=${type}`);
  };

  const goToUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const setTempToken = () => {
    const tempToken = prompt('개발용 JWT 토큰을 입력하세요:');
    if (tempToken) {
      setAuthToken(tempToken);
      setError(null);
      loadProfile();
    }
  };

  const quickLogin = async () => {
    try {
      const response = await authApi.login({
        email: 'test@example.com',
        password: 'test1234'
      });
      setAuthToken(response.token);
      setError(null);
      window.location.reload();
    } catch (err: any) {
      console.error('빠른 로그인 실패:', err);
      setError('빠른 로그인에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <div className={styles.devActions}>
            <button onClick={quickLogin} className={styles.devButton}>
              빠른 로그인 (test@example.com)
            </button>
            <button onClick={() => window.location.reload()} className={styles.devButton}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 상단: 프로필 이미지/MBTI + 통계 */}
      <div className={styles.topRow}>
        <div className={styles.avatarBox}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ececec&color=bbb`}
              alt="프로필 이미지"
              className={styles.avatarImg}
            />
            <span className={styles.mbtiBadge}>{profile.mbti}</span>
          </div>
        </div>
        <div className={styles.statsBox}>
          <div className={styles.statsRow}>
            <span className={styles.statNum}>{profile.diaryCount}</span>
            <span className={styles.statNum}>{profile.followerCount}</span>
            <span className={styles.statNum}>{profile.followingCount}</span>
          </div>
          <div className={styles.statsLabelRow}>
            <span className={styles.statLabel}>일기</span>
            <span className={styles.statLabel}>팔로워</span>
            <span className={styles.statLabel}>팔로잉</span>
          </div>
        </div>
      </div>

      {/* 이름/메시지 */}
      <div className={styles.profileTextBox}>
        <div className={styles.nickname}><span role="img" aria-label="heart">💖</span>{profile.name}</div>
        <div className={styles.bio}>{profile.message} <span role="img" aria-label="smile">😊</span></div>
      </div>

      {/* 버튼 */}
      <div className={styles.buttonRow}>
        <button onClick={handleEditProfile} className={styles.pinkButton}>프로필 편집</button>
        <button onClick={handleTogglePublic} className={styles.pinkButton}>프로필 공개</button>
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
                    cursor: isFuture ? 'not-allowed' : (isToday ? 'pointer' : (day.hasEntry ? 'pointer' : 'default')),
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
                    if (isToday) {
                      router.push('/diary/new');
                    } else if (isPast && day.hasEntry) {
                      console.log(`View my diary for ${day.date}`);
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

      {/* 개발용 섹션 */}
      {error && (
        <div className={styles.devSection}>
          <div className={styles.errorMessage}>{error}</div>
          <div className={styles.devActions}>
            <button onClick={quickLogin} className={styles.devButton}>
              빠른 로그인
            </button>
            <button onClick={() => window.location.reload()} className={styles.devButton}>
              새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

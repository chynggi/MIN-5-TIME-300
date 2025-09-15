'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { profileApi } from '../../services/profile-api';
import { followApi } from '../../services/follow-api';
import { diaryApi } from '../../services/diary-api';
import { statisticsApi } from '../../services/statistics-api';
import { getRealtimeSocket, disconnectRealtimeSocket } from '@/lib/realtimeSocket';
import { ProfileResponse } from '../../types/api';
// ActivityIndicator 제거: 활동지수를 다른 statCard들과 동일한 비주얼로 통일
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
  profileImageUrl?: string;
  profileColor?: string;
  activityScore?: number; // 활동지수 (0-100)
}

interface CalendarDay {
  date: number;
  emotion?: string;
  hasEntry: boolean;
  diaryId?: string;
}

// 프로필 테마 색상을 기반으로 CSS 변수 style 객체 생성
function buildThemeStyle(profileColor?: string) {
  if (!profileColor) return undefined;
  // 지원: hex (#RRGGBB), rgb/rgba(), linear-gradient 등
  // gradient 그대로 쓰고, 단색이면 파생 색상 계산
  const isGradient = /gradient\(/i.test(profileColor);
  let accent = profileColor.trim();
  let accentRgb = '99 102 241'; // fallback 기존 indigo
  let accentSoft = 'rgba(0,0,0,0.05)';
  if (!isGradient) {
    // Hex -> RGB
    const hex = profileColor.replace('#','');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      accentRgb = `${r} ${g} ${b}`;
      // lighten 배경 (10%)
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile>({
    name: 'Unknown',
    message: '',
    diaryCount: 0,
    followerCount: 0,
    followingCount: 0,
    lpgScore: 0,
    lpgGrade: 'Bronze I',
    gradeLevel: 1,
    heartProgress: 0,
    isPublic: true,
    mbti: 'INFJ',
    profileColor: undefined,
    activityScore: 0,
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
      
      // 로컬 날짜 형식 변환 함수 (시간대 문제 해결)
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const todayLocalDate = formatLocalDate(new Date());
      
      // 현재 달의 날짜들 추가
      for (let date = 1; date <= daysInMonth; date++) {
        const currentDateObj = new Date(year, month, date);
        const todayObj = new Date(todayYear, todayMonth, todayDate);
        const dateString = formatLocalDate(currentDateObj);
        
        let emotion = "";
        let hasEntry = false;
        let diaryId = "";
        
        // 해당 날짜에 일기가 있는지 확인 (로컬 날짜 기준)
        const diary = myDiaries.find(d => {
          const diaryDate = new Date(d.diaryDate); // diaryDate 사용
          return formatLocalDate(diaryDate) === dateString;
        });
          console.log('📅 오늘 날짜 처리 디버그:');
          console.log('- 오늘 날짜:', dateString);
        
        // 오늘 이전 날짜들과 오늘
        if (currentDateObj <= todayObj) {
          if (diary) {
            hasEntry = true;
            diaryId = diary.id;
            // 실제 저장된 이모지 사용, 없으면 emotionScore 기반으로 폴백
            const emotionScore = diary.emotionScore || 0;
            if (diary.emotion) {
              emotion = diary.emotion; // 실제 저장된 이모지 사용
            } else {
              // emotionScore를 기반으로 감정 결정 (폴백)
              if (emotionScore >= 8) emotion = "😊"; // happy
              else if (emotionScore >= 6) emotion = "🤩"; // excited
              else if (emotionScore >= 4) emotion = "😌"; // calm
              else if (emotionScore >= 2) emotion = "😢"; // sad
              else emotion = "😠"; // angry
            }
          } else {
            // 일기가 없는 경우 (미래 날짜나 과거에 작성하지 않은 날짜)
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
          hasEntry,
          diaryId
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
    // 실시간 소켓 연결
    const socket = getRealtimeSocket();
    socket.on('connect', () => {
      // 자신의 프로필 자동 구독(게이트웨이에서 join 됨) + 명시적 재구독
      if ((window as any)._myProfileUserId) {
        socket.emit('profile.subscribe', { userId: (window as any)._myProfileUserId });
      }
    });
    socket.on('profile.counters.update', (data: any) => {
      setProfile(prev => {
        if (!prev) return prev;
        if (data.userId && data.userId === (window as any)._myProfileUserId) {
          return {
            ...prev,
            followerCount: data.followerCount !== undefined ? data.followerCount : prev.followerCount,
            followingCount: data.followingCount !== undefined ? data.followingCount : prev.followingCount,
            diaryCount: data.diaryCount !== undefined ? data.diaryCount : prev.diaryCount,
          };
        }
        return prev;
      });
    });
    return () => {
      socket.off('profile.counters.update');
      disconnectRealtimeSocket();
    };
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
        message: profileData.bio || '안녕하세요! 😊',
        mbti: profileData.mbti || 'INFJ',
        profileImageUrl: profileData.profileImageUrl,
        profileColor: (profileData as any).profileColor,
        activityScore: profileData.activityScore ?? prev.activityScore ?? 0,
      }));
      // 전역에 사용자 ID 기억 (간단한 공유)
      (window as any)._myProfileUserId = profileData.id;
      // 연결되어 있다면 구독 보장
      try {
        const socket = getRealtimeSocket();
        socket.emit('profile.subscribe', { userId: profileData.id });
      } catch {}
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
      // 새로운 follow API로 현재 사용자의 팔로우 카운터 조회
      // 현재 사용자 ID를 가져와야 함 - 임시로 localStorage나 프로필에서 가져오기
      const currentUserProfile = await profileApi.getProfile();
      const counters = await followApi.getFollowCounters(currentUserProfile.id);
      
      setProfile(prev => ({
        ...prev,
        followerCount: counters.followersCount || 0,
        followingCount: counters.followingCount || 0,
      }));
      setLoading(false);
    } catch (err: any) {
      console.error('팔로우 통계 로드 실패:', err);
      // fallback으로 기존 데이터 유지
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
      <div className={styles.container} style={buildThemeStyle(profile.profileColor)}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} style={buildThemeStyle(profile.profileColor)}>
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
    <div className={styles.container} style={buildThemeStyle(profile.profileColor)}>
      <div className={`${styles.simpleStack} ${styles.fadeIn}`}>
        {/* 좌측 / 기본 프로필 영역 */}
        <section className={`${styles.panel} ${styles.profileHeader}`} aria-label="프로필 기본 정보">
          <button
            type="button"
            className={styles.settingsIconBtn}
            aria-label="프로필 설정 이동"
            onClick={() => router.push('/profile/settings')}
            title="설정"
          >
            ⚙️
          </button>
          <div className={styles.avatarWrapModern}>
            {profile.profileImageUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${profile.profileImageUrl}`}
                alt={`${profile.name} 프로필 이미지`}
                className={styles.avatarImgModern}
                loading="lazy"
              />
            ) : (
              <div className={styles.avatarFallback} aria-hidden="true">
                {profile.name.slice(0,2).toUpperCase()}
              </div>
            )}
            <span className={styles.mbtiBadgeModern} aria-label="MBTI">{profile.mbti}</span>
          </div>
          <div className={styles.basicInfo}>
            <h1 className={styles.nicknameModern}>{profile.name}</h1>
            <p className={styles.bioModern}>{profile.message}</p>
            <div className={styles.statsModern}>
              <button className={styles.statCard} onClick={() => handleStatsClick('followers')} aria-label={`일기 ${profile.diaryCount}개`}>
                <span className={styles.statValue}>{profile.diaryCount}</span>
                <span className={styles.statLabelModern}>DIARIES</span>
              </button>
              <button className={styles.statCard} onClick={() => handleStatsClick('followers')} aria-label={`팔로워 ${profile.followerCount}명`}>
                <span className={styles.statValue}>{profile.followerCount}</span>
                <span className={styles.statLabelModern}>FOLLOWERS</span>
              </button>
              <button className={styles.statCard} onClick={() => handleStatsClick('following')} aria-label={`팔로잉 ${profile.followingCount}명`}>
                <span className={styles.statValue}>{profile.followingCount}</span>
                <span className={styles.statLabelModern}>FOLLOWING</span>
              </button>
              {/* 활동지수 카드: 다른 statCard와 동일한 구조 */}
              <div
                className={styles.statCard}
                aria-label={`활동지수 ${profile.activityScore ?? 0}%`}
                role="presentation"
              >
                <span className={styles.statValue}>{profile.activityScore ?? 0}%</span>
                <span className={styles.statLabelModern}>ACTIVITY</span>
                {/* 향후: 히트맵/미니 바 추가 가능 */}
              </div>
            </div>
            <div className={styles.actionRow}>
              <button onClick={handleEditProfile} className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                ✏️ 프로필 편집
              </button>
            </div>
          </div>
        </section>

        {/* 중앙 / 캘린더 */}
        <section className={`${styles.calendarPanel}`} aria-label="감정/일기 캘린더">
          <header className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.calendarNavBtn}
              aria-label="이전 달"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >◀</button>
            <h2 className={styles.calendarTitle}>
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <button
              type="button"
              className={styles.calendarNavBtn}
              aria-label="다음 달"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >▶</button>
          </header>
          <div className={styles.weekdayRow} aria-hidden="true">
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} className={styles.weekdayCell}>{d}</div>
            ))}
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
              if ((day as any).isRetrospective) labelParts.push('회고 있음');
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
                      if (day.hasEntry && day.diaryId) {
                        router.push(`/diary/${day.diaryId}`);
                      } else {
                        const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day.date).padStart(2,'0')}`;
                        router.push(`/diary/new?date=${dateStr}`);
                      }
                    }}
                  >
                    <span className={styles.dayDate}>{day.date}</span>
                    {day.emotion && (
                      <span className={styles.dayEmoji}>{day.emotion}</span>
                    )}
                    {isToday && !day.hasEntry && (
                      <span style={{fontSize:'0.5rem',color:'var(--c-accent)'}}>오늘</span>
                    )}
                    {day.hasEntry && (day as any).isRetrospective && (
                      <span className={styles.dayBadge}>회고</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className={styles.legendRow} aria-hidden="true">
            <div className={styles.legendItem}><span className={styles.legendDot}></span>작성</div>
            <div className={styles.legendItem}>🔒 미래</div>
            <div className={styles.legendItem}>회고</div>
          </div>
        </section>

        {/* 단일 컬럼 유지: 사이드 패널 제거 */}
      </div>

      {error && (
        <div className={styles.devSection}>
          <div className={styles.errorMessage}>{error}</div>
          <div className={styles.devActions}>
            <button onClick={quickLogin} className={styles.devButton}>빠른 로그인</button>
            <button onClick={() => window.location.reload()} className={styles.devButton}>새로고침</button>
          </div>
        </div>
      )}
    </div>
  );
}

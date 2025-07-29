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

  useEffect(() => {
    checkConnection();
    loadProfile();
    loadFriendStats();
    loadDiaryStats();
    loadLPGScore();
  }, []);

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

  // 등급별 하트 색상 반환
  const getHeartColor = (level: number): string => {
    const colors = [
      '#8B4513', '#A0522D', '#CD853F', // Bronze
      '#C0C0C0', '#D3D3D3', '#E5E5E5', // Silver  
      '#FFD700', '#FFA500', '#FF8C00', // Gold
      '#E5E4E2', '#F0F0F0', '#FFFFFF'  // Platinum, Diamond
    ];
    return colors[Math.min(level - 1, 11)] || '#8B4513';
  };

  // 등급별 하트 이모지 반환
  const getHeartEmoji = (level: number): string => {
    const hearts = [
      '🖤', '🖤', '🖤', // Bronze - 검은 하트
      '🤍', '🤍', '🤍', // Silver - 흰 하트  
      '💛', '🧡', '❤️', // Gold - 노랑, 주황, 빨강
      '💜', '💙', '💖'  // Platinum, Diamond - 보라, 파랑, 핑크
    ];
    return hearts[Math.min(level - 1, 11)] || '🖤';
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
      {/* 프로필 헤더 */}
      <div className={styles.header}>
        <div className={styles.profileSection}>
          {/* 프로필 이미지 (LPG 링 제거) */}
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff`}
                alt="프로필 이미지"
              />
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className={styles.profileInfo}>
            <h1 className={styles.username}>{profile.name}</h1>
            <p className={styles.bio}>{profile.message}</p>
            
            {/* 통계 */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{profile.diaryCount}</span>
                <span className={styles.statLabel}>게시물</span>
              </div>
              <div 
                className={styles.stat} 
                onClick={() => handleStatsClick('followers')}
              >
                <span className={styles.statNumber}>{profile.followerCount}</span>
                <span className={styles.statLabel}>팔로워</span>
              </div>
              <div 
                className={styles.stat}
                onClick={() => handleStatsClick('following')}
              >
                <span className={styles.statNumber}>{profile.followingCount}</span>
                <span className={styles.statLabel}>팔로잉</span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className={styles.actions}>
              <button onClick={handleEditProfile} className={styles.editButton}>
                프로필 편집
              </button>
              <button onClick={handleTogglePublic} className={styles.shareButton}>
                프로필 공유
              </button>
            </div>

            {/* LPG 점수 섹션 */}
            <div className={styles.lpgSection}>
              <div className={styles.lpgContainer}>
                <div className={styles.lpgRing}>
                  <svg className={styles.lpgSvg} viewBox="0 0 120 120">
                    {/* 배경 원 */}
                    <circle 
                      cx="60" cy="60" r="50" 
                      fill="none" 
                      stroke="#f0f0f0" 
                      strokeWidth="6"
                    />
                    {/* 진행률 원 */}
                    <circle 
                      cx="60" cy="60" r="50" 
                      fill="none" 
                      stroke="url(#gradient)" 
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(profile.lpgScore / 100) * 314} 314`}
                      transform="rotate(-90 60 60)"
                    />
                    {/* 그라디언트 정의 */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="50%" stopColor="#764ba2" />
                        <stop offset="100%" stopColor="#f093fb" />
                      </linearGradient>
                    </defs>
                    
                    {/* 하트들을 원형으로 배치 */}
                    {Array.from({ length: 12 }).map((_, index) => {
                      const angle = (index * 30) - 90; // 30도씩 배치, -90도로 시작점 조정
                      const x = 60 + 40 * Math.cos(angle * Math.PI / 180);
                      const y = 60 + 40 * Math.sin(angle * Math.PI / 180);
                      const isFilled = (index + 1) <= profile.gradeLevel;
                      const isCurrentGrade = (index + 1) === profile.gradeLevel;
                      
                      return (
                        <text 
                          key={index}
                          x={x} y={y + 3}
                          textAnchor="middle" 
                          fontSize="10"
                          fill={isFilled ? getHeartColor(index + 1) : '#ddd'}
                          opacity={isCurrentGrade ? 0.5 + (profile.heartProgress / 200) : (isFilled ? 1 : 0.3)}
                        >
                          💖
                        </text>
                      );
                    })}
                  </svg>
                  
                  {/* 중앙 LPG 점수 */}
                  <div className={styles.lpgCenter}>
                    <div className={styles.lpgScore}>{profile.lpgScore.toFixed(1)}%</div>
                    <div className={styles.lpgGrade}>{profile.lpgGrade}</div>
                  </div>
                </div>
                
                <div className={styles.lpgInfo}>
                  <div className={styles.lpgTitle}>LPG Score</div>
                  <div className={styles.lpgDescription}>
                    Life Pattern Grade - 당신의 생활 패턴 점수
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하이라이트 */}
      <div className={styles.highlights}>
        <div className={styles.highlight}>
          <div className={styles.highlightCircle}>
            <span>📝</span>
          </div>
          <span className={styles.highlightLabel}>일기</span>
        </div>
        <div className={styles.highlight}>
          <div className={styles.highlightCircle}>
            <span>💭</span>
          </div>
          <span className={styles.highlightLabel}>감정</span>
        </div>
        <div className={styles.highlight}>
          <div className={styles.highlightCircle}>
            <span>📊</span>
          </div>
          <span className={styles.highlightLabel}>통계</span>
        </div>
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.tabActive}`}>
          <span>⋮⋮⋮</span>
        </div>
        <div className={styles.tab}>
          <span>📋</span>
        </div>
        <div className={styles.tab}>
          <span>👤</span>
        </div>
      </div>

      {/* 게시물 그리드 */}
      <div className={styles.postsGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={styles.post}>
            <div className={styles.postContent}>
              <span className={styles.postIcon}>📔</span>
              <div className={styles.postOverlay}>
                <span className={styles.postStats}>
                  <span>❤️ 12</span>
                  <span>� 3</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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

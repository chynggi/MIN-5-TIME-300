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

  // 하트 렌더링 (12개, 각 등급별로 채워짐)
  const renderHearts = () => {
    const hearts = [];
    for (let i = 1; i <= 12; i++) {
      const isFilled = i <= profile.gradeLevel;
      const isCurrentGrade = i === profile.gradeLevel;
      const fillPercentage = isCurrentGrade ? profile.heartProgress : (isFilled ? 100 : 0);
      
      hearts.push(
        <div 
          key={i} 
          className={styles.heart}
          style={{
            background: isFilled 
              ? `linear-gradient(90deg, ${getHeartColor(i)} ${fillPercentage}%, #ddd ${fillPercentage}%)`
              : '#ddd'
          }}
        >
          💖
        </div>
      );
    }
    return hearts;
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.error}>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={setTempToken} className={styles.devButton}>
              개발용 토큰 설정
            </button>
            <button onClick={quickLogin} className={styles.devButton}>
              빠른 로그인 (test@example.com)
            </button>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* 프로필 헤더 */}
      <div className={styles.profileHeader}>
        <div className={styles.profileImageContainer}>
          <div className={styles.profileImage}>
            <img 
              src="/api/placeholder/100/100" 
              alt="프로필 이미지"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff`;
              }}
            />
          </div>
          
          {/* LPG 점수 원형 표시 */}
          <div className={styles.lpgCircle}>
            <div className={styles.lpgText}>
              <span className={styles.lpgScore}>{profile.lpgScore.toFixed(1)}%</span>
              <span className={styles.lpgGrade}>{profile.lpgGrade}</span>
            </div>
          </div>
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.profileName}>{profile.name}</div>
          <div className={styles.profileMsg}>{profile.message}</div>
          
          {/* 하트 진행률 표시 */}
          <div className={styles.heartsContainer}>
            {renderHearts()}
          </div>
          
          <div className={styles.profileStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{profile.diaryCount}</span>
              <span className={styles.statLabel}>일기</span>
            </div>
            <div 
              className={styles.statItem} 
              onClick={() => handleStatsClick('followers')}
            >
              <span className={styles.statNumber}>{profile.followerCount}</span>
              <span className={styles.statLabel}>팔로워</span>
            </div>
            <div 
              className={styles.statItem}
              onClick={() => handleStatsClick('following')}
            >
              <span className={styles.statNumber}>{profile.followingCount}</span>
              <span className={styles.statLabel}>팔로잉</span>
            </div>
          </div>

          <div className={styles.profileActions}>
            <button 
              onClick={handleEditProfile}
              className={styles.editButton}
            >
              프로필 편집
            </button>
            <button 
              onClick={handleTogglePublic}
              className={`${styles.toggleButton} ${profile.isPublic ? styles.public : styles.private}`}
            >
              {profile.isPublic ? '공개' : '비공개'}
            </button>
          </div>
        </div>
      </div>

      {/* 하이라이트 섹션 */}
      <div className={styles.highlights}>
        <div className={styles.highlight}>
          <div className={styles.highlightImage}>📝</div>
          <span>일기 하이라이트</span>
        </div>
        <div className={styles.highlight}>
          <div className={styles.highlightImage}>💭</div>
          <span>감정 기록</span>
        </div>
        <div className={styles.highlight}>
          <div className={styles.highlightImage}>📊</div>
          <span>통계</span>
        </div>
      </div>

      {/* 일기 그리드 */}
      <div className={styles.diaryGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.diaryItem}>
            <div className={styles.diaryThumbnail}>
              <span>📔</span>
            </div>
          </div>
        ))}
      </div>

      {/* 개발용 - 다른 사용자 프로필 테스트 */}
      <div className={styles.devSection}>
        <h3>개발용 테스트</h3>
        <button 
          onClick={() => goToUserProfile('user123')} 
          className={styles.devButton}
        >
          다른 사용자 프로필 보기
        </button>
      </div>
    </div>
  );
}

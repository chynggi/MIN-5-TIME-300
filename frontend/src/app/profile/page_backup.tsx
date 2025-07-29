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
  const [profile, setProfile] = useState<MyProfile>({
    name: 'Unknown',
    message: 'Happy Day!! 😊',
    diaryCount: 0,
    followerCount: 0,
    followingCount: 0,
    lpgScore: 0,
    isPublic: true,
    mbti: 'INFJ'
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
        // TODO: message, lpgScore 등은 추가 API 필요
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
      // 팔로워/팔로잉 수 가져오기 (친구 API 활용)
      const friendsData = await friendApi.getFriends('accepted');
      setProfile(prev => ({
        ...prev,
        followerCount: friendsData.totalCount || 0,
        followingCount: friendsData.totalCount || 0, // TODO: 실제로는 구분 필요
      }));
      setLoading(false);
    } catch (err: any) {
      console.error('친구 통계 로드 실패:', err);
      // 친구 통계는 실패해도 프로필은 표시
      setLoading(false);
    }
  };

  const loadDiaryStats = async () => {
    try {
      // 일기 통계 가져오기
      const diaryData = await diaryApi.getDiaries({ limit: 1 }); // 총 개수만 확인
      setProfile(prev => ({
        ...prev,
        diaryCount: diaryData.totalCount || 0,
      }));
    } catch (err: any) {
      console.error('일기 통계 로드 실패:', err);
      // 일기 통계는 실패해도 프로필은 표시
    }
  };

  const loadLPGScore = async () => {
    try {
      // LPG 점수 가져오기
      const lpgData = await statisticsApi.getLPGScore();
      setProfile(prev => ({
        ...prev,
        lpgScore: lpgData.lpgScore || 0,
      }));
    } catch (err: any) {
      console.error('LPG 점수 로드 실패:', err);
      // LPG 점수는 실패해도 프로필은 표시 (기본값 0 유지)
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

  // 테스트용 - 다른 사용자 프로필로 이동
  const goToUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // 개발용 - 임시 토큰 설정
  const setTempToken = () => {
    const tempToken = prompt('개발용 JWT 토큰을 입력하세요:');
    if (tempToken) {
      setAuthToken(tempToken);
      setError(null);
      loadProfile();
    }
  };

  // 서버 연결 테스트
  const testServerConnection = async () => {
    setLoading(true);
    setError(null);
    const isConnected = await testConnection();
    if (isConnected) {
      setError(null);
      await loadProfile();
    } else {
      setError('백엔드 서버에 연결할 수 없습니다. http://localhost:3001 에서 서버가 실행 중인지 확인해주세요.');
      setLoading(false);
    }
  };

  // 개발용 - 빠른 로그인
  const quickLogin = async () => {
    const email = prompt('이메일을 입력하세요:');
    const password = prompt('비밀번호를 입력하세요:');
    
    if (email && password) {
      try {
        setLoading(true);
        const response = await authApi.login({ email, password });
        setAuthToken(response.token);
        setError(null);
        await loadProfile();
      } catch (err: any) {
        console.error('로그인 실패:', err);
        alert('로그인 실패: ' + err.message);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          프로필을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.errorContainer}>
          <div>{error}</div>
          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={testServerConnection}
              style={{ margin: '4px', padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2196F3', color: 'white', cursor: 'pointer' }}
            >
              서버 연결 테스트
            </button>
          </div>
          {error.includes('로그인이 필요합니다') && (
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={quickLogin}
                style={{ margin: '4px', padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#e1306c', color: 'white', cursor: 'pointer' }}
              >
                빠른 로그인
              </button>
              <button 
                onClick={() => router.push('/login')}
                style={{ margin: '4px', padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#4CAF50', color: 'white', cursor: 'pointer' }}
              >
                로그인 페이지로 이동
              </button>
              <button 
                onClick={setTempToken}
                style={{ margin: '4px', padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#666', color: 'white', cursor: 'pointer' }}
              >
                개발용 토큰 설정
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span>{profile.mbti}</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>{profile.diaryCount}</div>
            <div className={styles.statLabel}>일기</div>
          </div>
          <div 
            className={styles.stat}
            onClick={() => handleStatsClick('followers')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statNum}>{profile.followerCount}</div>
            <div className={styles.statLabel}>팔로워</div>
          </div>
          <div 
            className={styles.stat}
            onClick={() => handleStatsClick('following')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statNum}>{profile.followingCount}</div>
            <div className={styles.statLabel}>팔로잉</div>
          </div>
        </div>
      </div>
      <div className={styles.profileName}>{profile.name}</div>
      <div className={styles.profileMsg}>{profile.message}</div>
      <div className={styles.btnRow}>
        <button className={styles.btn} onClick={handleEditProfile}>
          프로필 편집
        </button>
        <button 
          className={`${styles.btn} ${styles.secondary}`}
          onClick={handleTogglePublic}
        >
          프로필 설정
        </button>
      </div>
      <div className={styles.lpgCircle}>
        <span className={styles.lpgText}>LPG 💖 {profile.lpgScore}%</span>
      </div>
      <div className={styles.iconRow}>
        <span className={`${styles.icon} ${styles.active}`}>📖</span>
        <span className={styles.icon}>💬</span>
        <span className={styles.icon}>👥</span>
        <span className={styles.icon}>🙋‍♂️</span>
      </div>
      
      {/* 테스트용 - 다른 프로필로 이동하는 버튼들 */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>
          테스트용 - 다른 사용자 프로필 보기:
        </div>
        <button 
          onClick={() => goToUserProfile('user1')}
          style={{ margin: '4px', padding: '8px 12px', border: 'none', borderRadius: '4px', background: '#e1306c', color: 'white', cursor: 'pointer' }}
        >
          Alice 프로필
        </button>
        <button 
          onClick={() => goToUserProfile('user2')}
          style={{ margin: '4px', padding: '8px 12px', border: 'none', borderRadius: '4px', background: '#e1306c', color: 'white', cursor: 'pointer' }}
        >
          Bob 프로필
        </button>
      </div>
    </div>
  );
}

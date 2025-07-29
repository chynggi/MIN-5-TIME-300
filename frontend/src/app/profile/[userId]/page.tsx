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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.userId as string; // 실제로 username을 나타냅니다
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          await api.post('/friends/request', { userId: profile.id });
        }
        setProfile(prev => prev ? { ...prev, isFollowing: !prev.isFollowing, followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1 } : prev);
      } catch (err) {
        console.error('팔로우 토글 에러', err);
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
        <div className={styles.lpgCircle}>
          <span className={styles.lpgText}>비공개</span>
        </div>
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
      <div className={styles.lpgCircle}>
        <span className={styles.lpgText}>LPG 💖 {profile.lpgScore}%</span>
      </div>
      <div className={styles.iconRow}>
        <span className={`${styles.icon} ${styles.active}`}>📖</span>
        <span className={styles.icon}>💬</span>
        <span className={styles.icon}>👥</span>
        <span className={styles.icon}>🙋‍♂️</span>
      </div>
    </div>
  );
}

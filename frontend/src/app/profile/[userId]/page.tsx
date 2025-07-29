'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from '../profile.module.css';

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
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API 호출로 대체
    // 임시 데이터
    const mockProfile: UserProfile = {
      id: userId,
      name: userId === 'user1' ? 'Alice' : userId === 'user2' ? 'Bob' : 'Unknown User',
      message: userId === 'user1' ? '오늘도 좋은 하루! ✨' : userId === 'user2' ? '힘내자! 💪' : 'Hello World!',
      diaryCount: userId === 'user1' ? 89 : userId === 'user2' ? 156 : 42,
      followerCount: userId === 'user1' ? 245 : userId === 'user2' ? 187 : 73,
      followingCount: userId === 'user1' ? 198 : userId === 'user2' ? 234 : 91,
      lpgScore: userId === 'user1' ? 87.2 : userId === 'user2' ? 92.8 : 76.5,
      isFollowing: false,
      isPublic: true,
      mbti: userId === 'user1' ? 'ENFP' : userId === 'user2' ? 'ISTJ' : 'INFJ'
    };
    
    setTimeout(() => {
      setProfile(mockProfile);
      setLoading(false);
    }, 500);
  }, [userId]);

  const handleStatsClick = (type: 'followers' | 'following') => {
    // 공개 프로필일 때만 팔로워/팔로잉 목록 보기 가능
    if (profile?.isPublic) {
      router.push(`/profile/follow-list?tab=${type}&userId=${userId}`);
    }
  };

  const handleFollowToggle = () => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
        followerCount: profile.isFollowing 
          ? profile.followerCount - 1 
          : profile.followerCount + 1
      });
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

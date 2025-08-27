'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../profile.module.css';
import { followApi } from '../../../services/follow-api';
import { profileApi } from '../../../services/profile-api';

interface User {
  id: string;
  name: string;
  mbti?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
  status?: 'pending' | 'accepted';
}

function FollowListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'followers';
  const username = searchParams.get('username'); // 실제로는 username
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendData();
  }, [tab]);

  const loadFriendData = async () => {
    setLoading(true);
    try {
      if (username) {
        // 타인의 팔로워/팔로잉 목록 조회
        // TODO: username을 userId로 변환하는 로직 필요
        // 임시로 빈 배열 설정
        setFollowers([]);
        setFollowing([]);
      } else {
        // 내 팔로워/팔로잉 목록 조회
        if (tab === 'followers') {
          // 현재 사용자의 팔로워 목록 조회 - userId 필요
          // 임시로 profileApi에서 현재 사용자 정보 가져오기
          const currentProfile = await profileApi.getProfile();
          const followersData = await followApi.getFollowers(currentProfile.id);
          const followerList = followersData.data.map((follow: any) => ({
            id: follow.follower.id,
            name: follow.follower.username,
            mbti: follow.follower.mbti,
            isFollowing: false, // 팔로워 탭에서는 내가 그들을 팔로우하는지 별도 확인 필요
            isFollower: true,
            status: (follow.status === 'ACTIVE' ? 'accepted' : 'pending') as 'pending' | 'accepted',
          }));
          setFollowers(followerList);
        } else {
          // 현재 사용자의 팔로잉 목록 조회
          const currentProfile = await profileApi.getProfile();
          const followingData = await followApi.getFollowing(currentProfile.id);
          const followingList = followingData.data.map((follow: any) => ({
            id: follow.followee.id,
            name: follow.followee.username,
            mbti: follow.followee.mbti,
            isFollowing: true,
            isFollower: false, // 팔로잉 탭에서는 그들이 나를 팔로우하는지 별도 확인 필요
            status: (follow.status === 'ACTIVE' ? 'accepted' : 'pending') as 'pending' | 'accepted',
          }));
          setFollowing(followingList);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('팔로우 데이터 로드 실패:', err);
      setLoading(false);
    }
  };  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/profile/follow-list?${params.toString()}`);
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleFollowToggle = async (targetUserId: string, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) {
        // 언팔로우
        await followApi.unfollowUser(targetUserId);
      } else {
        // 팔로우
        await followApi.followUser(targetUserId);
      }
      
      // 로컬 상태 업데이트
      if (tab === 'followers') {
        setFollowers(prev => 
          currentlyFollowing 
            ? prev.map(user => 
                user.id === targetUserId 
                  ? { ...user, isFollowing: false }
                  : user
              )
            : prev.map(user => 
                user.id === targetUserId 
                  ? { ...user, isFollowing: true }
                  : user
              )
        );
      } else {
        // 팔로잉 탭에서 언팔로우 시 목록에서 제거
        if (currentlyFollowing) {
          setFollowing(prev => prev.filter(user => user.id !== targetUserId));
        }
      }
    } catch (err: any) {
      console.error('팔로우 토글 실패:', err);
      alert(err.response?.data?.message || '작업에 실패했습니다.');
    }
  };

  const currentList = tab === 'followers' ? followers : following;

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          목록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>
           {username ? '친구 목록' : (tab === 'followers' ? '팔로워' : '팔로잉')}
        </h1>
      </div>

  {!username && (
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${tab === 'followers' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('followers')}
          >
            팔로워 ({followers.length})
          </button>
          <button 
            className={`${styles.tab} ${tab === 'following' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('following')}
          >
            팔로잉 ({following.length})
          </button>
        </div>
      )}

      <div className={styles.userList}>
        {currentList.length === 0 ? (
          <div className={styles.emptyState}>
             {username 
              ? '친구 목록이 비공개입니다.' 
              : (tab === 'followers' ? '팔로워가 없습니다' : '팔로잉한 사용자가 없습니다')
            }
          </div>
        ) : (
          currentList.map((user) => (
            <div key={user.id} className={styles.userItem}>
              <div 
                className={styles.userInfo}
                  onClick={() => handleUserClick(user.name)}
              >
                <div className={styles.userAvatar}>
                  {user.mbti || '👤'}
                </div>
                <div>
                  <div className={styles.userName}>{user.name}</div>
                  {user.status === 'pending' && (
                    <div style={{ fontSize: '12px', color: '#666' }}>요청 대기 중</div>
                  )}
                </div>
              </div>
               {!username && user.status === 'accepted' && (
                <button 
                  className={`${styles.followBtn} ${
                    tab === 'followers' 
                      ? (user.isFollowing ? styles.followBtnFollowing : styles.followBtnFollow)
                      : styles.followBtnUnfollow
                  }`}
                  onClick={() => handleFollowToggle(
                    user.id, 
                    tab === 'followers' ? user.isFollowing || false : true
                  )}
                >
                  {tab === 'followers' 
                    ? (user.isFollowing ? '팔로잉' : '팔로우')
                    : '언팔로우'
                  }
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FollowListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FollowListContent />
    </Suspense>
  );
}

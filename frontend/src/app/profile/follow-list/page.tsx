'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../profile.module.css';
import { friendApi } from '../../../services/friend-api';

interface User {
  id: string;
  name: string;
  mbti?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
  status?: 'pending' | 'accepted';
}

export default function FollowListPage() {
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
        // 타인의 팔로워/팔로잉 목록 (별도 API 필요)
        // TODO: 타인의 친구 목록 조회 API 구현 필요
        setFollowers([]);
        setFollowing([]);
      } else {
        // 내 친구 목록 조회
        const friendData = await friendApi.getFriends('accepted');
        const userList = friendData.friends.map(friend => ({
          id: friend.id,
          name: friend.username,
          mbti: friend.mbti,
          isFollowing: true,
          isFollower: true,
          status: friend.status,
        }));
        
        setFollowers(userList);
        setFollowing(userList);
      }
      setLoading(false);
    } catch (err) {
      console.error('친구 데이터 로드 실패:', err);
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: string) => {
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
        // 언팔로우 로직 (친구 삭제 - 별도 API 필요)
        // TODO: 친구 삭제 API 구현 필요
        console.log('언팔로우:', targetUserId);
      } else {
        // 팔로우 로직 (친구 요청)
        await friendApi.requestFriend({ targetUserId });
      }
      
      // 로컬 상태 업데이트
      if (tab === 'followers') {
        setFollowers(prev => 
          currentlyFollowing 
            ? prev.filter(user => user.id !== targetUserId)
            : prev.map(user => 
                user.id === targetUserId 
                  ? { ...user, isFollowing: !currentlyFollowing }
                  : user
              )
        );
      } else {
        setFollowing(prev => 
          currentlyFollowing 
            ? prev.filter(user => user.id !== targetUserId)
            : prev.map(user => 
                user.id === targetUserId 
                  ? { ...user, isFollowing: !currentlyFollowing }
                  : user
              )
        );
      }
    } catch (err) {
      console.error('팔로우 토글 실패:', err);
      alert('작업에 실패했습니다.');
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { communityService, CommunityPost } from '@/lib/api/community';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/Community.module.css';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await communityService.getPosts(page, 10);
      
      if (page === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasMore(response.posts.length === 10); // 10개 미만이면 더 이상 없는 것으로 간주
    } catch (err) {
      console.error('게시글 목록을 불러오는 중 오류 발생:', err);
      setError('게시글 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // 내용 미리보기 생성
  const createPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>커뮤니티</h1>
        {user && (
          <Link href="/community/new">
            <button className={styles.newButton}>새 글 작성</button>
          </Link>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterBar}>
        <div className={styles.filterOptions}>
          <button className={`${styles.filterButton} ${styles.active}`}>최신순</button>
          <button className={styles.filterButton}>인기순</button>
          <button className={styles.filterButton}>댓글순</button>
        </div>
      </div>

      <div className={styles.postList}>
        {posts.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>등록된 게시글이 없습니다.</p>
            <p>첫 번째 게시글을 작성해보세요!</p>
          </div>
        ) : (
          posts.map(post => (
            <Link href={`/community/${post.id}`} key={post.id}>
              <div className={styles.postCard}>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postPreview}>{createPreview(post.content)}</p>
                
                {post.tags && post.tags.length > 0 && (
                  <div className={styles.postTags}>
                    {post.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
                
                <div className={styles.postMeta}>
                  <div className={styles.postAuthor}>
                    <span>작성자: {post.authorName}</span>
                  </div>
                  <div className={styles.postInfo}>
                    <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
                    <span className={styles.postStats}>
                      <span className={styles.likes}>❤️ {post.likes}</span>
                      <span className={styles.comments}>💬 {post.comments}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {hasMore && posts.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button 
            onClick={loadMore} 
            disabled={loading} 
            className={styles.loadMoreButton}
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}
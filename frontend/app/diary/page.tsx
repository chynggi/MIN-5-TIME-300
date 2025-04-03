'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { diaryService, DiaryEntry } from '@/lib/api/diary';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/Diary.module.css';

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // 인증 로딩이 끝나고 사용자가 로그인되어 있지 않으면 로그인 페이지로 리다이렉션
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // 인증된 사용자만 일기 목록 로드
    if (!authLoading && user) {
      loadDiaries();
    }
  }, [authLoading, user, page]);

  const loadDiaries = async () => {
    try {
      setLoading(true);
      const response = await diaryService.getDiaries(page, 10);
      
      if (page === 1) {
        setDiaries(response.diaries);
      } else {
        setDiaries(prev => [...prev, ...response.diaries]);
      }
      
      setHasMore(response.diaries.length === 10); // 10개 미만이면 더 이상 없는 것으로 간주
    } catch (err) {
      console.error('일기 목록을 불러오는 중 오류 발생:', err);
      setError('일기 목록을 불러오는 데 실패했습니다.');
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
        <h1 className={styles.title}>나의 일기장</h1>
        <Link href="/diary/new">
          <button className={styles.newButton}>새 일기 작성</button>
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.diaryList}>
        {diaries.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>작성된 일기가 없습니다.</p>
            <p>새로운 일기를 작성해보세요!</p>
          </div>
        ) : (
          diaries.map(diary => (
            <Link href={`/diary/${diary.id}`} key={diary.id}>
              <div className={styles.diaryCard}>
                <div className={styles.diaryHeader}>
                  <h2 className={styles.diaryTitle}>{diary.title}</h2>
                  {diary.mood && (
                    <span className={`${styles.diaryMood} ${styles[`mood-${diary.mood}`]}`}>
                      {diary.mood}
                    </span>
                  )}
                </div>
                <p className={styles.diaryDate}>{formatDate(diary.createdAt)}</p>
                <p className={styles.diaryPreview}>{createPreview(diary.content)}</p>
                {diary.tags && diary.tags.length > 0 && (
                  <div className={styles.diaryTags}>
                    {diary.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {hasMore && diaries.length > 0 && (
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
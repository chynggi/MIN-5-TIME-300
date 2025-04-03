'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { questionsService, Question } from '@/lib/api/questions';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/Questions.module.css';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadQuestions();
  }, [page, filter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsService.getQuestions(page, 10, filter);
      
      if (page === 1) {
        setQuestions(response.questions);
      } else {
        setQuestions(prev => [...prev, ...response.questions]);
      }
      
      setHasMore(response.questions.length === 10);
    } catch (err) {
      console.error('질문 목록을 불러오는 중 오류 발생:', err);
      setError('질문 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'open' | 'resolved') => {
    if (filter !== newFilter) {
      setFilter(newFilter);
      setPage(1); // 필터 변경시 1페이지로 돌아감
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>질문 &amp; 답변</h1>
        {user && (
          <Link href="/questions/new">
            <button className={styles.askButton}>질문하기</button>
          </Link>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterBar}>
        <div className={styles.filterOptions}>
          <button 
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            전체 질문
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'open' ? styles.active : ''}`}
            onClick={() => handleFilterChange('open')}
          >
            미해결 질문
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'resolved' ? styles.active : ''}`}
            onClick={() => handleFilterChange('resolved')}
          >
            해결된 질문
          </button>
        </div>
      </div>

      <div className={styles.questionList}>
        {questions.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>등록된 질문이 없습니다.</p>
            <p>첫 번째 질문을 남겨보세요!</p>
          </div>
        ) : (
          questions.map(question => (
            <Link href={`/questions/${question.id}`} key={question.id}>
              <div className={styles.questionCard}>
                <div className={styles.questionStatus}>
                  <div className={styles.answerCount}>
                    <span className={styles.count}>{question.answerCount}</span>
                    <span className={styles.label}>답변</span>
                  </div>
                  {question.isResolved && (
                    <div className={styles.resolvedBadge}>
                      해결됨
                    </div>
                  )}
                </div>

                <div className={styles.questionContent}>
                  <h2 className={styles.questionTitle}>{question.title}</h2>
                  
                  {question.tags && question.tags.length > 0 && (
                    <div className={styles.questionTags}>
                      {question.tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className={styles.questionMeta}>
                    <span className={styles.questionAuthor}>{question.authorName}</span>
                    <span className={styles.questionDate}>
                      {formatDate(question.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {hasMore && questions.length > 0 && (
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
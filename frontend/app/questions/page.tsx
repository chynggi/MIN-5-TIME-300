'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { questionsService, Question } from '@/lib/api/questions';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/Questions.module.css';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [page, selectedCategory]);

  const loadCategories = async () => {
    try {
      const categoriesData = await questionsService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('카테고리 목록을 불러오는 중 오류 발생:', err);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsService.getQuestions(
        page, 
        10, 
        undefined, 
        undefined, 
        selectedCategory
      );
      
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

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    setPage(1); // 카테고리 변경 시 첫 페이지로 돌아가기
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>일기 질문 프롬프트</h1>
        {user && (
          <Link href="/questions/new">
            <button className={styles.askButton}>질문 작성하기</button>
          </Link>
        )}
      </div>

      <div className={styles.description}>
        육하원칙(5W1H)에 따른 질문들을 통해 다양한 관점에서 일기를 작성해보세요.
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.categoryFilter}>
        <button 
          className={`${styles.categoryButton} ${selectedCategory === undefined ? styles.active : ''}`}
          onClick={() => handleCategoryChange(undefined)}
        >
          전체
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className={styles.questionList}>
        {questions.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>등록된 질문 프롬프트가 없습니다.</p>
            <p>새로운 질문을 작성해보세요!</p>
          </div>
        ) : (
          questions.map(question => (
            <Link href={`/questions/${question.id}`} key={question.id}>
              <div className={styles.questionCard}>
                <div className={styles.questionContent}>
                  <div className={styles.questionCategory}>
                    {question.categoryInfo?.name || '기타'}
                  </div>
                  <h2 className={styles.questionTitle}>{question.title}</h2>
                  
                  <p className={styles.questionDescription}>
                    {question.content.length > 120 
                      ? `${question.content.substring(0, 120)}...` 
                      : question.content}
                  </p>
                  
                  {question.tags && question.tags.length > 0 && (
                    <div className={styles.questionTags}>
                      {question.tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className={styles.questionMeta}>
                    <span className={styles.questionAuthor}>{question.author?.username}</span>
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
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { questionsService, Question } from '@/lib/api/questions';
import styles from '@/styles/Questions.module.css';

export default function QuestionDetailPage() {
  const { id } = useParams();
  const questionId = Array.isArray(id) ? id[0] : id; // id가 배열일 경우 첫 번째 요소를 사용

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionId) {
      loadQuestion(questionId);
    }
  }, [questionId]);

  const loadQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      const questionData = await questionsService.getQuestion(questionId);
      setQuestion(questionData);
    } catch (err) {
      console.error('질문을 불러오는 중 오류 발생:', err);
      setError('질문을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!question) {
    return <div className={styles.emptyState}>질문을 찾을 수 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{question.title}</h1>
      </div>

      <div className={styles.meta}>
        <span className={styles.author}>{question.author?.username}</span>
        <span className={styles.date}>{new Date(question.createdAt).toLocaleDateString('ko-KR')}</span>
      </div>

      <div className={styles.content}>{question.content}</div>

      {question.tags && question.tags.length > 0 && (
        <div className={styles.tags}>
          {question.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { diaryService, DiaryEntry } from '@/lib/api/diary';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/DiaryDetail.module.css';

export default function DiaryDetailPage() {
  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const diaryId = params.id as string;
  const { user } = useAuth();

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        setLoading(true);
        const data = await diaryService.getDiary(diaryId);
        setDiary(data);
      } catch (err: any) {
        console.error('일기 불러오기 실패:', err);
        setError('일기를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId]);

  const handleDelete = async () => {
    try {
      await diaryService.deleteDiary(diaryId);
      router.push('/diary');
    } catch (err: any) {
      console.error('일기 삭제 중 오류:', err);
      setError('일기를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodEmoji = (mood?: string) => {
    const moodEmojis: {[key: string]: string} = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
      excited: '😃',
      tired: '😫',
      anxious: '😰',
      peaceful: '😌',
    };

    return mood && moodEmojis[mood] ? moodEmojis[mood] : '📝';
  };

  const getMoodText = (mood?: string) => {
    const moodTexts: {[key: string]: string} = {
      happy: '행복함',
      sad: '슬픔',
      angry: '화남',
      neutral: '보통',
      excited: '신남',
      tired: '피곤함',
      anxious: '불안함',
      peaceful: '평온함',
    };

    return mood && moodTexts[mood] ? moodTexts[mood] : '기록됨';
  };

  if (loading) {
    return <div className={styles.loading}>일기를 불러오는 중...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!diary) {
    return <div className={styles.notFound}>일기를 찾을 수 없습니다.</div>;
  }

  const isOwner = user && user.id === diary.userId;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.dateContainer}>
          <div className={styles.date}>{formatDate(diary.createdAt)}</div>
          <div className={styles.time}>{formatTime(diary.createdAt)}</div>
        </div>
        
        {isOwner && (
          <div className={styles.actions}>
            <Link href={`/diary/${diaryId}/edit`}>
              <button className={styles.editButton}>수정</button>
            </Link>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className={styles.deleteButton}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div className={styles.mood}>
        <span className={styles.moodEmoji}>{getMoodEmoji(diary.mood)}</span>
        <span className={styles.moodText}>{getMoodText(diary.mood)}</span>
      </div>

      <h1 className={styles.title}>{diary.title}</h1>
      
      <div className={styles.content}>
        {diary.content.split('\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {diary.tags && diary.tags.length > 0 && (
        <div className={styles.tags}>
          {diary.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <button 
          onClick={() => router.back()} 
          className={styles.backButton}
        >
          뒤로 가기
        </button>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>일기 삭제</h3>
            <p>정말 이 일기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={styles.cancelButton}
              >
                취소
              </button>
              <button 
                onClick={handleDelete}
                className={styles.confirmButton}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
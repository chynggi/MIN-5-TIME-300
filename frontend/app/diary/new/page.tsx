'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { diaryService } from '@/lib/api/diary';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/DiaryForm.module.css';

export default function NewDiaryPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'neutral',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // 인증되지 않은 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // 내용 변경 시 단어 수 업데이트
  useEffect(() => {
    const words = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [formData.content]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await diaryService.createDiary({
        title: formData.title,
        content: formData.content,
        mood: formData.mood,
        tags: tags.length > 0 ? tags : undefined,
      });
      router.push('/diary');
    } catch (err: any) {
      console.error('일기 작성 중 오류:', err);
      setError(err.response?.data?.message || '일기를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (authLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>새 일기 작성</h1>
        <div className={styles.date}>{new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="일기의 제목을 입력하세요"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="mood">오늘의 기분</label>
          <select
            id="mood"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="happy">행복함 😊</option>
            <option value="sad">슬픔 😢</option>
            <option value="angry">화남 😠</option>
            <option value="neutral">보통 😐</option>
            <option value="excited">신남 😃</option>
            <option value="tired">피곤함 😫</option>
            <option value="anxious">불안함 😰</option>
            <option value="peaceful">평온함 😌</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="오늘 있었던 일이나 생각, 느낌을 자유롭게 적어보세요."
            rows={15}
          />
          <div className={styles.wordCount}>{wordCount}단어</div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags">태그</label>
          <div className={styles.tagInput}>
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className={styles.input}
              placeholder="태그를 입력하고 Enter를 누르세요"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button 
              type="button" 
              onClick={addTag}
              className={styles.addTagButton}
            >
              추가
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)} 
                    className={styles.removeTagButton}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className={styles.cancelButton}
          >
            취소
          </button>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
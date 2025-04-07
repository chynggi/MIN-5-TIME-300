"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { questionsService, CategoryInfo } from '@/lib/api/questions';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/QuestionForm.module.css';

export default function NewQuestionPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState<number>(0); // 기본값: WHO
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    
    loadCategories();
  }, [authLoading, user, router]);

  const loadCategories = async () => {
    try {
      const categoriesData = await questionsService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('카테고리 목록을 불러오는 중 오류 발생:', err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await questionsService.createQuestion({
        title,
        content,
        category,
        tags,
      });
      router.push('/questions');
    } catch (err: any) {
      setError(err.message || '질문 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>새로운 질문 작성하기</h1>
      
      <p className={styles.description}>
        일기 작성에 도움이 될 질문을 작성해주세요. 
        육하원칙(5W1H)에 기반해 카테고리를 선택하면 
        다양한 관점에서 일기를 쓰는데 도움이 됩니다.
      </p>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="category">카테고리</label>
          <select 
            id="category" 
            value={category}
            onChange={e => setCategory(Number(e.target.value))}
            className={styles.select}
            required
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} - {cat.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className={styles.input}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="질문 내용을 자세히 작성해주세요"
            rows={6}
            className={styles.textarea}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="tags">태그</label>
          <div className={styles.tagInput}>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="태그를 입력하고 Enter 키를 누르세요"
              className={styles.input}
              onKeyDown={e => {
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
            <div className={styles.tagList}>
              {tags.map((tag, index) => (
                <div key={index} className={styles.tag}>
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(index)} 
                    className={styles.removeTagButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            onClick={() => router.push('/questions')}
            className={styles.cancelButton}
            disabled={loading}
          >
            취소
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import { communityService } from '@/lib/api/community';
import styles from '@/styles/Community.module.css';

export default function NewCommunityPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await communityService.createPost({
        title,
        content,
        tags: tags.split(',').map(tag => tag.trim()),
      });
      router.push('/community');
    } catch (err) {
      console.error('게시글 작성 중 오류 발생:', err);
      setError('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>새 글 작성</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="tags">태그 (쉼표로 구분)</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? '작성 중...' : '작성하기'}
        </button>
      </form>
    </div>
  );
}
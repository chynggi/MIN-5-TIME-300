import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { communityService, CommunityPost } from '@/lib/api/community';
import styles from '@/styles/Community.module.css';

export default function CommunityDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPost(id as string);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      setLoading(true);
      const fetchedPost = await communityService.getPost(postId);
      setPost(fetchedPost);
    } catch (err) {
      console.error('게시글을 불러오는 중 오류 발생:', err);
      setError('게시글을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{post.title}</h1>
      <div className={styles.meta}>
        <span>작성자: {post.authorName}</span>
        <span>작성일: {new Date(post.createdAt).toLocaleDateString()}</span>
      </div>
      <div className={styles.content}>{post.content}</div>
      {post.tags && (
        <div className={styles.tags}>
          {post.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
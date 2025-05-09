"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { diaryService } from "@/lib/api/diary";
import styles from "@/styles/Diary.module.css";

// Define the DiaryEntry type
interface DiaryEntry {
  title: string;
  content: string;
  mood: string;
  isPrivate: boolean;
}

export default function ViewPostPage() {
  const [post, setPost] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (typeof id === "number") {
          const fetchedPost = await diaryService.getDiary(id);
          setPost({
            ...fetchedPost,
            mood: fetchedPost.mood ?? "알 수 없음", // Provide a default value for mood
          });
        } else {
          throw new Error("Invalid post ID");
        }
      } catch (err) {
        console.error("게시글 불러오기 오류:", err);
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchPost();
  }, [id]);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!post) return <div className={styles.loading}>로딩 중...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{post.title}</h1>
      <p>{post.content}</p>
      <div className="mt-4">
        <span>기분: {post.mood}</span>
        <span> | 공개 여부: {post.isPrivate ? "비공개" : "공개"}</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { diaryService, DiaryEntry } from "@/lib/api/diary";
import styles from "../../styles/Diary.module.css";

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        setLoading(true);
        const response = await diaryService.getDiaries(filter);
        setDiaries(response);
      } catch (err: any) {
        console.error("다이어리를 불러오는 중 오류 발생:", err);
        setError("다이어리를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, [filter]);

  console.log(styles);

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className={styles.title}>다이어리 목록</h1>
      <div className={styles.filters}>
        <button onClick={() => setFilter("all")}>전체</button>
        <button onClick={() => setFilter("shared")}>공유된 다이어리</button>
      </div>
      <div className={styles.diaryList}>
        {diaries.map((diary) => (
          <div key={diary.id} className={styles.diaryCard}>
            <h2 className={styles.diaryTitle}>{diary.title}</h2>
            <p className={styles.diaryContent}>{diary.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

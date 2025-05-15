"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { diaryService } from "@/lib/api/diary";
import styles from "@/styles/Diary.module.css";

export default function NewDiaryPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: "neutral",
    isPrivate: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await diaryService.createDiary(formData);
      router.push("/diary");
    } catch (err: any) {
      console.error("다이어리 작성 중 오류:", err);
      setError("다이어리를 저장하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <div className={styles.container}>
        <h1 className={styles.title}>새 다이어리 작성</h1>
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
              placeholder="다이어리 제목을 입력하세요"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="다이어리 내용을 입력하세요"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mood">기분</label>
            <select
              id="mood"
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="happy">행복함 😊</option>
              <option value="sad">슬픔 😢</option>
              <option value="neutral">보통 😐</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>공개 범위</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="isPrivate"
                  value="true"
                  checked={formData.isPrivate === true}
                  onChange={() => setFormData((prev) => ({ ...prev, isPrivate: true }))}
                />
                비공개
              </label>
              <label>
                <input
                  type="radio"
                  name="isPrivate"
                  value="false"
                  checked={formData.isPrivate === false}
                  onChange={() => setFormData((prev) => ({ ...prev, isPrivate: false }))}
                />
                공개
              </label>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

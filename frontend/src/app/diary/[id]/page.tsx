"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

interface DiaryDetail {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  writingDuration: number;
  reactions: any[];
}

export default function DiaryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/diaries/${id}`)
      .then((res) => {
        setDiary(res.data);
        setContent(res.data.content);
      })
      .catch(() => setError("일기 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      await api.put(`/diaries/${id}`, { content });
      setDiary((d) => (d ? { ...d, content } : d));
      setEditMode(false);
    } catch {
      setError("수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/diaries/${id}`);
      router.push("/diary");
    } catch {
      setError("삭제에 실패했습니다.");
    }
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!diary) return <div className="p-4">일기 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">일기 상세</h2>
      <div className="mb-2 text-gray-500 text-sm">
        {new Date(diary.createdAt).toLocaleString()}
      </div>
      <div className="mb-4 text-blue-700 font-semibold">{diary.question}</div>
      {editMode ? (
        <>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[120px] mb-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              저장
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              취소
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 whitespace-pre-line">{diary.content}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

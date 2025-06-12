"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

interface CommunityDiaryDetail {
  id: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  user: { id: string; username: string; mbti: string; profileImageUrl?: string };
  reactionCounts: { like: number; hug: number; support: number };
  commentCount: number;
}

export default function CommunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [diary, setDiary] = useState<CommunityDiaryDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/communities/diaries/${id}`)
      .then(res => {
        setDiary(res.data);
        setContent(res.data.content);
        setQuestion(res.data.question);
      })
      .catch(() => setError("질문 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      await api.put(`/communities/diaries/${id}`, { content, question });
      setDiary(d => d ? { ...d, content, question } : d);
      setEditMode(false);
    } catch {
      setError("수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/communities/diaries/${id}`);
      router.push("/community");
    } catch {
      setError("삭제에 실패했습니다.");
    }
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!diary) return <div className="p-4">질문 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">질문 상세</h2>
      <div className="mb-2 text-gray-500 text-sm">{new Date(diary.createdAt).toLocaleString()} | {diary.user.username}</div>
      {editMode ? (
        <>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[120px] mb-2"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
            <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-300 rounded">취소</button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 font-semibold text-lg">{diary.question}</div>
          <div className="mb-4 whitespace-pre-line">{diary.content}</div>
          <div className="flex gap-2">
            <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded">수정</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded">삭제</button>
          </div>
        </>
      )}
    </div>
  );
}

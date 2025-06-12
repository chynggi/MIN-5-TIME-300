"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function CommunityNewPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 실제 API 엔드포인트에 맞게 수정 필요
      await api.post("/communities/diaries", {
        content,
        question,
        isPublic: true,
      });
      router.push("/community");
    } catch (err: any) {
      setError("질문 추천 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">질문 추천 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="추천 질문"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          placeholder="추천 이유 또는 설명"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 min-h-[120px]"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "등록 중..." : "등록"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
    </div>
  );
}

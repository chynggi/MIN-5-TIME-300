"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

interface DiaryListItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
}

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<DiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/diaries")
      .then((res) => setDiaries(res.data.diaries))
      .catch(() => setError("일기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">내 일기 목록</h2>
        <Link
          href="/diary/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          새 일기 작성
        </Link>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : diaries.length === 0 ? (
        <div>작성한 일기가 없습니다.</div>
      ) : (
        <ul className="space-y-4">
          {diaries.map((diary) => (
            <li
              key={diary.id}
              className="border rounded p-4 hover:bg-gray-50"
            >
              <Link href={`/diary/${diary.id}`} className="block">
                <div className="font-semibold text-lg mb-1">
                  {diary.question}
                </div>
                <div className="text-gray-700 line-clamp-2 mb-1">
                  {diary.content}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(diary.createdAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

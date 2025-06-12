"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

interface CommunityDiaryUser {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}

interface CommunityDiaryListItem {
  id: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  emotionScore: number;
  mediaUrl?: string;
  mediaType?: string;
  question: string;
  user: CommunityDiaryUser;
  reactionCounts: { like: number; hug: number; support: number };
  commentCount: number;
}

export default function CommunityPage() {
  const [diaries, setDiaries] = useState<CommunityDiaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/communities/diaries")
      .then((res) => setDiaries(res.data.diaries))
      .catch(() => setError("커뮤니티 일기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">질문 추천 커뮤니티</h2>
        <Link
          href="/community/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          질문 추천
        </Link>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : diaries.length === 0 ? (
        <div>아직 추천된 질문이 없습니다.</div>
      ) : (
        <ul className="space-y-4">
          {diaries.map((diary) => (
            <li
              key={diary.id}
              className="border rounded p-4 hover:bg-gray-50"
            >
              <Link href={`/community/${diary.id}`} className="block">
                <div className="font-semibold text-lg mb-1">
                  {diary.question}
                </div>
                <div className="text-gray-700 line-clamp-2 mb-1">
                  {diary.content}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(diary.createdAt).toLocaleString()} |{" "}
                  {diary.user.username} | 좋아요 {diary.reactionCounts.like}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

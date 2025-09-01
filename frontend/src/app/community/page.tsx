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
  // 전역 보라색 채팅 아이콘 제거: ChatList 관련 상태 삭제

  useEffect(() => {
    api
      .get("/communities/diaries")
      .then((res) => setDiaries(res.data.diaries))
      .catch(() => setError("커뮤니티 일기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">질문 추천 커뮤니티</h2>
        <div className="flex space-x-2">
          {/* 질문 추천 버튼 */}
          <Link
            href="/community/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>질문 추천</span>
          </Link>
        </div>
      </div>
      {/* 전역 채팅 아이콘 및 ChatList 모달 제거됨 */}
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

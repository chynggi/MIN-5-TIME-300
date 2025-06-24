"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface DiaryPreview { id: string; content: string; createdAt: string; question: string; }
interface CommunityPreview { id: string; content: string; createdAt: string; user: { username: string }; question: string; }
interface ChatRoomPreview { id: string; name: string; createdAt: string; }

export default function DashboardPage() {
  const [diaries, setDiaries] = useState<DiaryPreview[]>([]);
  const [communities, setCommunities] = useState<CommunityPreview[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/diaries").then(res => res.data.diaries.slice(0, 3)).catch(() => []),
      api.get("/communities/diaries").then(res => res.data.diaries.slice(0, 3)).catch(() => []),
      api.get("/chat/rooms").then(res => res.data.rooms.slice(0, 3)).catch(() => []),
    ])
      .then(([d, c, r]) => {
        setDiaries(d);
        setCommunities(c);
        setChatRooms(r);
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-pink-50 py-6">
      <div className="w-full max-w-md md:max-w-2xl flex flex-col gap-4">
        {/* 최근 일기 */}
        <section className="bg-white rounded-xl shadow p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">최근 일기</h2>
            <Link href="/diary" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="space-y-2">
              {diaries.length === 0 ? <li>작성한 일기가 없습니다.</li> : diaries.map(d => (
                <li key={d.id} className="border rounded p-2 hover:bg-gray-50">
                  <Link href={`/diary/${d.id}`}>{d.question || d.content.slice(0, 20)}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* 최근 커뮤니티 */}
        <section className="bg-white rounded-xl shadow p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">최근 커뮤니티</h2>
            <Link href="/community" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="space-y-2">
              {communities.length === 0 ? <li>추천된 질문이 없습니다.</li> : communities.map(c => (
                <li key={c.id} className="border rounded p-2 hover:bg-gray-50">
                  <Link href={`/community/${c.id}`}>{c.question || c.content.slice(0, 20)} <span className="text-xs text-gray-400">- {c.user?.username}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* 최근 채팅방 */}
        <section className="bg-white rounded-xl shadow p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">최근 채팅방</h2>
            <Link href="/chat" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="space-y-2">
              {chatRooms.length === 0 ? <li>참여한 채팅방이 없습니다.</li> : chatRooms.map(r => (
                <li key={r.id} className="border rounded p-2 hover:bg-gray-50">
                  <Link href={`/chat/${r.id}`}>{r.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {/* 오늘 일기 작성 버튼 */}
      <Link
        href="/diary/new"
        className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg font-bold z-20"
      >
        오늘 일기 쓰기
      </Link>
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-2 z-10 md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:rounded-t-xl md:shadow">
        <Link href="/dashboard" className="flex flex-col items-center text-blue-600 font-bold">🏠<span className="text-xs">홈</span></Link>
        <Link href="/diary" className="flex flex-col items-center">📔<span className="text-xs">일기</span></Link>
        <Link href="/community" className="flex flex-col items-center">💬<span className="text-xs">커뮤니티</span></Link>
        <Link href="/chat" className="flex flex-col items-center">💬<span className="text-xs">채팅</span></Link>
        <Link href="/profile" className="flex flex-col items-center">👤<span className="text-xs">프로필</span></Link>
      </nav>
    </div>
  );
}

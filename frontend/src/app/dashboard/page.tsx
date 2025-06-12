
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

// 임시 데이터 (실제 연동 시 API로 대체)
const mockFriends = [
  { id: "1", name: "친구1", emoji: "😊" },
  { id: "2", name: "친구2", emoji: "😢" },
  { id: "3", name: "친구3", emoji: "😎" },
  { id: "4", name: "친구4", emoji: "😐" },
  { id: "5", name: "친구5", emoji: "😡" },
];
const today = new Date().getDate();
const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
const mockCalendar = Array.from({ length: daysInMonth }, (_, i) => ({
  day: i + 1,
  emoji: ["😊", "😢", "😡", "😎", "😐"][Math.floor(Math.random() * 5)],
}));

interface DiaryPreview { id: string; content: string; createdAt: string; }
interface CommunityPreview { id: string; content: string; createdAt: string; user: { username: string } }
interface ChatRoomPreview { id: string; name: string; createdAt: string; }


export default function DashboardPage() {
  // 실제 연동 시 useEffect로 API 호출 및 상태 관리
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-pink-50 py-6">
      {/* 상단 스토리(친구 일기) */}
      <div className="w-full max-w-md md:max-w-2xl flex overflow-x-auto gap-3 p-3 bg-white rounded-xl shadow mb-4 border">
        {mockFriends.map(f => (
          <Link key={f.id} href={`/profile/${f.id}`} className="flex flex-col items-center min-w-[56px]">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-300 to-pink-300 flex items-center justify-center text-2xl border-2 border-pink-400">
              {f.emoji}
            </div>
            <span className="text-xs mt-1">{f.name}</span>
          </Link>
        ))}
      </div>

      {/* 달력 */}
      <div className="w-full max-w-md md:max-w-2xl bg-white rounded-xl shadow p-4 mb-4 border">
        <div className="flex justify-between items-center mb-2">
          <button className="text-lg font-bold">{"<"}</button>
          <span className="font-bold text-lg">{new Date().getFullYear()}년 {new Date().getMonth() + 1}월</span>
          <button className="text-lg font-bold">{">"}</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {mockCalendar.map(({ day, emoji }) => (
            <Link
              key={day}
              href={`/diary/${day}`}
              className={`flex flex-col items-center justify-center aspect-square rounded transition hover:bg-blue-50 ${day === today ? "bg-blue-100" : ""}`}
            >
              <span className="text-lg md:text-xl">{emoji}</span>
              <span className="text-xs">{day}</span>
            </Link>
          ))}
        </div>
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

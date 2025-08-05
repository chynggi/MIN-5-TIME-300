"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

// 서버 응답에 맞춘 ChatRoom 인터페이스
interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/chat/rooms")
      .then((res) => setRooms(res.data.rooms || res.data.chatRooms || []))
      .catch(() => setError("채팅방 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">채팅방 목록</h2>
        <Link
          href="/chat/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          새 채팅방
        </Link>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : rooms.length === 0 ? (
        <div>아직 채팅방이 없습니다.</div>
      ) : (
        <ul className="space-y-4">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="border rounded p-4 hover:bg-gray-50"
            >
              <Link href={`/chat/${room.id}`} className="block">
                <div className="font-semibold text-lg mb-1">{room.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(room.createdAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

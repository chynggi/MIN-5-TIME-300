"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Map from "@/components/Map";
import FriendSearch from "@/components/FriendSearch";
// DiaryPin 타입을 이 파일에서 정의하여 lat/lng를 number | undefined로 허용
export interface DiaryPin {
  id: string;
  lat: number;
  lng: number;
  profileImageUrl?: string;
}
// 임시 사용자 정보 (실제 로그인 정보로 대체 필요)
const currentUser = {
  id: "me",
  profileImageUrl: "/default-profile.png", // 실제 프로필 이미지 경로로 변경
};
interface PublicDiary {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  writingDuration: number;
  userId: string;
  lat?: number; // 추가
  lng?: number; // 추가
  profileImageUrl?: string; // 추가
  username?: string; // 추가
}

export default function Community2ListPage() {
  const [diaries, setDiaries] = useState<PublicDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/diaries/public")
      .then(res => {
        const raw: PublicDiary[] = res.data.diaries || [];

        // 사용자별 최신 일기만 남기기 (Record 기반)
        const latestByUser: Record<string, PublicDiary> = {};
        raw.forEach((d, idx) => {
          const uid = d.userId || `unknown-${idx}`;
          const prev = latestByUser[uid];
          const curTime = new Date(d.updatedAt || d.createdAt).getTime();
          const prevTime = prev ? new Date(prev.updatedAt || prev.createdAt).getTime() : -Infinity;
          if (!prev || curTime > prevTime) {
            latestByUser[uid] = d;
          }
        });

        // 위치 정보 보정 + 기본 프로필/닉네임 보강
        const diariesWithLocation: PublicDiary[] = Object.values(latestByUser).map((diary: PublicDiary, index: number) => ({
          ...diary,
          lat: typeof diary.lat === 'number' ? diary.lat : (37.5665 + (Math.random() - 0.5) * 0.02),
          lng: typeof diary.lng === 'number' ? diary.lng : (126.9780 + (Math.random() - 0.5) * 0.02),
          profileImageUrl: diary.profileImageUrl || '/default-profile.png',
          username: diary.username || `사용자${index + 1}`
        }));

        setDiaries(diariesWithLocation);
      })
      .catch(() => setError("공개 일기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // DiaryPin[]로 변환 (좌표 정보가 없으면 빈 배열)
  // 공개일기가 없으면 빈 배열 반환
  const diaryPins: DiaryPin[] = diaries.length === 0
    ? []
    : diaries
        .filter(diary => typeof diary.lat === "number" && typeof diary.lng === "number")
        .map(diary => ({
          id: diary.id,
          lat: diary.lat as number,
          lng: diary.lng as number,
          profileImageUrl: diary.profileImageUrl,
          content: diary.content,
          username: diary.username,
        }));

  return (
    <>
      {/* 헤더 추가 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm">⏰</span>
            </div>
            <h1 className="text-xl font-bold">5MIN Community</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* 검색 기능 */}
            <FriendSearch />
            {/* 채팅 아이콘 추가 */}
            <Link
              href="/chat"
              className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
              aria-label="채팅"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.977L3 20l1.977-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Map pins={diaryPins} />
      </div>
    </>
  );
}

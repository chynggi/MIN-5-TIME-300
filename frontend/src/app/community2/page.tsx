"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Map from "@/components/Map";
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
}

export default function Community2ListPage() {
  const [diaries, setDiaries] = useState<PublicDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/community2/public-diaries")
      .then(res => setDiaries(res.data.diaries))
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
        }));

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Map pins={diaryPins} />
      </div>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">커뮤니티2 - 공개 일기</h2>
          <Link href="/community2/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">새 공개 일기</Link>
        </div>
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : diaries.length === 0 ? (
          <div>아직 공개 일기가 없습니다.</div>
        ) : (
          <ul className="space-y-4">
            {diaries.map(diary => (
              <li key={diary.id} className="border rounded p-4 hover:bg-gray-50">
                <Link href={`/community2/${diary.id}`} className="block">
                  <div className="text-gray-700 line-clamp-2 mb-1">{diary.content}</div>
                  <div className="text-xs text-gray-400">{new Date(diary.createdAt).toLocaleString()}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

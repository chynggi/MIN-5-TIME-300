"use client";
import { useEffect, useState, useMemo } from "react";
// import Link from "next/link"; // 사이드바 방식으로 변경하면서 사용 제거
import api from "@/lib/axios";
import Map from "@/components/Map";
import FriendSearch from "@/components/FriendSearch";
import NearbyProfilesBar from "@/components/NearbyProfilesBar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { haversineDistanceMeters } from "@/utils/distance"; // isWithinRadius 제거 (미사용)
// DiaryPin 타입을 이 파일에서 정의하여 lat/lng를 number | undefined로 허용
export interface DiaryPin {
  id: string; // diary id
  lat: number;
  lng: number;
  profileImageUrl?: string;
  username?: string;
  content?: string;
  profileColor?: string | null;
}
// 임시 사용자 정보 (실제 로그인 정보로 대체 필요)
const currentUser = {
  id: "me",
  profileImageUrl: "/default-profile.jpg", // 실제 프로필 이미지 경로로 변경
};
interface PublicDiary {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  writingDuration: number;
  userId: string;
  lat?: number;
  lng?: number;
  profileImageUrl?: string;
  username?: string;
  profileColor?: string | null;
}

export default function CommunityListPage() {
  const [rawDiaries, setRawDiaries] = useState<PublicDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    api.get("/diaries/public", { params: { latestPerUser: 1 } })
      .then(res => {
        const raw: PublicDiary[] = res.data.diaries || [];
        setRawDiaries(raw);
      })
      .catch(() => setError("공개 일기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("위치 기능을 지원하지 않는 브라우저입니다.");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("위치 권한이 거부되었습니다.");
        } else {
          setLocError("위치를 가져오는 중 오류가 발생했습니다.");
        }
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // 백엔드가 이미 latestPerUser 제공 -> 그대로 pins 전환
  const diaryPins: DiaryPin[] = useMemo(() => {
    return (rawDiaries || [])
      .filter(d => typeof d.lat === 'number' && typeof d.lng === 'number')
      .map(d => ({
        id: d.id,
        lat: d.lat as number,
        lng: d.lng as number,
        profileImageUrl: d.profileImageUrl || '/default-profile.jpg',
        username: d.username || '사용자',
        content: d.content,
        profileColor: d.profileColor || null,
      }));
  }, [rawDiaries]);

  // 3km 반경 내 다른 사용자 프로필 목록 (자기 자신 제외 - 현재 로그인 사용자 id 정보를 알 수 없으므로 placeholder 비교 X)
  const nearbyProfiles = useMemo(() => {
    if (!myPosition) return [];
    const RADIUS = 3000; // meters
    return rawDiaries
      .filter(d => d.userId !== currentUser.id) // 자기 자신 제외 (현재 userId 대입)
      .filter(d => typeof d.lat === 'number' && typeof d.lng === 'number')
      .map(d => ({
        userId: d.userId,
        username: d.username,
        profileImageUrl: d.profileImageUrl,
        profileColor: d.profileColor,
        distanceMeters: haversineDistanceMeters(
          myPosition.lat,
          myPosition.lng,
          d.lat as number,
          d.lng as number
        ),
      }))
      .filter(p => p.distanceMeters !== undefined && p.distanceMeters <= RADIUS)
      .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }, [rawDiaries, myPosition]);

  // 기존 NavBar를 유지하고 지도는 그 아래 영역을 채우도록 구성
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* 상단 바: 자체 반투명 카드 스타일 */}
      <div className="mx-auto w-full md:w-2/3 xl:max-w-5xl bg-white/80 dark:bg-neutral-900/70 backdrop-blur border border-white/40 dark:border-neutral-700/40 rounded-xl shadow-sm p-4 mt-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm">⏰</span>
            </div>
            {/* 제목은 이전 요청으로 삭제 상태 유지 */}
          </div>
          <div className="flex items-center gap-3">
            <FriendSearch />
            <button
              onClick={() => setIsChatOpen(true)}
              className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
              aria-label="채팅 열기"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.977L3 20l1.977-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* 지도 섹션 (지도 자체 높이만 차지) */}
      <div className="flex justify-center mt-6 px-4">
        <div className="relative w-full md:w-2/3 xl:w-7/12 2xl:w-1/2 bg-white/75 dark:bg-neutral-900/60 backdrop-blur rounded-2xl border border-white/40 dark:border-neutral-700/40 shadow-sm overflow-hidden">
          {!loading && !error && <Map pins={diaryPins} />}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600 bg-white/60 backdrop-blur-sm z-10">불러오는 중...</div>
          )}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-500 text-white text-xs px-4 py-2 rounded shadow">{error}</div>
          )}
          {!loading && !error && diaryPins.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white text-gray-600 text-xs px-4 py-2 rounded shadow">표시할 위치가 있는 공개 일기가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 내 주변 섹션: 지도 바로 아래, 배경 카드 제거 */}
      <div className="mt-4 mb-10 px-4 flex justify-center">
        <div className="w-full md:w-2/3 xl:w-7/12 2xl:w-1/2">
          <h2 className="text-xs font-semibold mb-2 text-neutral-600 dark:text-neutral-300 tracking-wide">내 주변</h2>
          <NearbyProfilesBar
            profiles={nearbyProfiles}
            isLoadingLocation={locLoading}
            locationError={locError}
            inlineMode
          />
        </div>
      </div>

      {/* 전역 fixed 사이드바 */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

export interface NearbyProfileItem {
  userId: string;
  username?: string;
  profileImageUrl?: string;
  profileColor?: string | null;
  lastContent?: string;
  distanceMeters?: number; // 계산된 거리
}

interface NearbyProfilesBarProps {
  profiles: NearbyProfileItem[];
  isLoadingLocation: boolean;
  locationError?: string;
  inlineMode?: boolean; // true면 하단 고정바 대신 인라인 박스 형태로 렌더
}

// 3km 내 사용자 리스트 하단 고정 바
export default function NearbyProfilesBar({
  profiles,
  isLoadingLocation,
  locationError,
  inlineMode = false,
}: NearbyProfilesBarProps) {
  const content = useMemo(() => {
    if (isLoadingLocation) {
      return <div className="text-xs text-gray-500 px-3 py-2">현재 위치 확인 중...</div>;
    }
    if (locationError) {
      return (
        <div className="text-xs text-red-500 px-3 py-2">
          위치를 가져올 수 없습니다: {locationError}
        </div>
      );
    }
    if (!profiles.length) {
      return (
        <div className="text-xs text-gray-500 px-3 py-2">반경 3km 내 다른 사용자가 없습니다.</div>
      );
    }
    return (
      <div className="flex gap-3 overflow-x-auto scrollbar-thin px-3 py-2">
        {profiles.map(p => (
          <Link
            key={p.userId}
            href={`/profile/${p.userId}`}
            className="flex-shrink-0 flex items-center gap-2 bg-green-100 hover:bg-green-200 transition-colors rounded-2xl px-3 py-2 border border-green-200 min-w-[160px]"
          >
            <div
              className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold"
              style={{
                background:
                  p.profileColor || "linear-gradient(135deg,#34d399,#10b981)",
              }}
            >
              {p.profileImageUrl ? (
                <Image
                  src={p.profileImageUrl}
                  alt={p.username || "user"}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                (p.username || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate">{p.username || "사용자"}</span>
              <span className="text-[10px] text-gray-500 truncate">
                {p.distanceMeters != null
                  ? formatDistance(p.distanceMeters)
                  : "-"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }, [profiles, isLoadingLocation, locationError]);

  if (inlineMode) {
    return (
      <div className="rounded-2xl border border-green-200 bg-white/80 dark:bg-neutral-900/70 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-700">내 주변 (3km)</span>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
      <div className="max-w-2xl mx-auto pb-safe">
        <div className="pointer-events-auto m-3 rounded-3xl shadow-lg bg-white/90 backdrop-blur border border-green-200">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-green-700">내 주변 (3km)</span>
            </div>
          </div>
          {content}
        </div>
      </div>
    </div>
  );
}

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

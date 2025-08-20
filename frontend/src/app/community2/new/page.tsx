"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function Community2NewPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [writingDuration, setWritingDuration] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  useEffect(() => {
    // 페이지 진입 시 위치 권한 요청
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/community2/public-diaries", {
        content,
        writingDuration: writingDuration || 1,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      });
      router.push("/community2");
    } catch (err: any) {
      setError("공개 일기 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">새 공개 일기 작성</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 위치 권한 상태 표시 */}
        <div className="text-xs text-gray-500">
          위치 권한: {geoStatus === "granted" ? "허용됨 ✅" : geoStatus === "denied" ? "거부됨 ❌" : geoStatus === "requesting" ? "요청 중..." : "대기"}
          {geoStatus !== "granted" && (
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) return;
                setGeoStatus("requesting");
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGeoStatus("granted");
                  },
                  () => setGeoStatus("denied")
                );
              }}
              className="ml-2 underline text-blue-600"
            >
              다시 시도
            </button>
          )}
        </div>
        <textarea
          placeholder="공개 일기 내용을 입력하세요"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 min-h-[120px]"
        />
        <input
          type="number"
          min={1}
          value={writingDuration}
          onChange={e => setWritingDuration(Number(e.target.value))}
          className="w-24 border rounded px-2 py-1"
          placeholder="작성 시간(분)"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "등록 중..." : "등록"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

interface DiaryFilterBarProps {
  onChange: (value: {
    query: string;
    visibility: "all" | "public" | "private";
    sort: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  loading?: boolean;
}

export default function DiaryFilterBar({ onChange, loading }: DiaryFilterBarProps) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [sort, setSort] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 디바운스 검색
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ query, visibility, sort, startDate: startDate || undefined, endDate: endDate || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [query, visibility, sort, startDate, endDate, onChange]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap bg-white/60 dark:bg-neutral-800/60 p-4 rounded-lg border">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[11px] font-medium mb-1 text-gray-600">검색</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="질문 또는 내용 검색"
          className="w-full text-sm rounded border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-neutral-900"
        />
      </div>
      <div className="w-28">
        <label className="block text-[11px] font-medium mb-1 text-gray-600">공개여부</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="w-full text-sm rounded border px-2 py-1.5 bg-white dark:bg-neutral-900"
        >
          <option value="all">전체</option>
            <option value="public">공개</option>
            <option value="private">비공개</option>
        </select>
      </div>
      <div className="w-36">
        <label className="block text-[11px] font-medium mb-1 text-gray-600">정렬</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full text-sm rounded border px-2 py-1.5 bg-white dark:bg-neutral-900"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="emotionHigh">감정 높은순</option>
          <option value="emotionLow">감정 낮은순</option>
        </select>
      </div>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-[11px] font-medium mb-1 text-gray-600">시작일</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm rounded border px-2 py-1.5 bg-white dark:bg-neutral-900" />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-gray-600">종료일</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm rounded border px-2 py-1.5 bg-white dark:bg-neutral-900" />
        </div>
      </div>
      {loading && <div className="text-xs text-gray-400 ml-auto">로딩중...</div>}
    </div>
  );
}

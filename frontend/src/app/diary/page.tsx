"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { diaryApi, DiaryItem } from "@/services/diary-api";
import DiaryFilterBar from "@/components/diary/DiaryFilterBar";
import DiaryListSkeleton from "@/components/diary/DiaryListSkeleton";
import EmptyState from "@/components/diary/EmptyState";
import { DiaryCard } from "@/components/diary/DiaryCard";

interface FilterState {
  query: string;
  visibility: "all" | "public" | "private";
  sort: string; // newest | oldest | emotionHigh | emotionLow
  startDate?: string;
  endDate?: string;
}

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterState>({ query: "", visibility: "all", sort: "newest" });
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page;
      const res = await diaryApi.getDiaries({ page: nextPage, limit: 20, startDate: filter.startDate, endDate: filter.endDate });
      setHasMore(res.hasMore);
      if (reset) {
        setDiaries(res.diaries);
        setPage(2);
      } else {
        setDiaries(prev => [...prev, ...res.diaries]);
        setPage(prev => prev + 1);
      }
    } catch (e) {
      setError("일기 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [page, filter.startDate, filter.endDate]);

  // 초기 로드
  useEffect(() => { loadPage(true); }, [filter.startDate, filter.endDate, loadPage]);

  // 무한 스크롤 옵저버
  useEffect(() => {
    if (!observerRef.current) return;
    const el = observerRef.current;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        loadPage();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadPage]);

  const handleFilterChange = useCallback((f: FilterState) => {
    setFilter(f);
  }, []);

  // 클라이언트 사이드 필터/정렬/검색
  const filtered = useMemo(() => {
    let list = [...diaries];
    if (filter.visibility !== "all") {
      list = list.filter(d => filter.visibility === "public" ? d.isPublic : !d.isPublic);
    }
    if (filter.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(d => (d.question || "").toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
    }
    switch (filter.sort) {
      case "oldest":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "emotionHigh":
        list.sort((a, b) => (b.emotionScore || 0) - (a.emotionScore || 0));
        break;
      case "emotionLow":
        list.sort((a, b) => (a.emotionScore || 0) - (b.emotionScore || 0));
        break;
      default: // newest
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [diaries, filter]);

  const stats = useMemo(() => {
    if (!diaries.length) return { total: 0, pub: 0, priv: 0, avg: 0 };
    const pub = diaries.filter(d => d.isPublic).length;
    const priv = diaries.length - pub;
    const scores = diaries.map(d => d.emotionScore).filter((n): n is number => typeof n === 'number');
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { total: diaries.length, pub, priv, avg };
  }, [diaries]);

  return (
  <div className="px-4 pb-6 pt-2 max-w-6xl mx-auto space-y-6 bg-white/70 dark:bg-neutral-900/40 backdrop-blur rounded-2xl shadow-sm border border-white/40 dark:border-neutral-700/40">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">내 일기</h1>
          <p className="text-sm text-gray-500 mt-1">하루 5분, 꾸준한 감정 기록</p>
        </div>
        <div className="flex gap-2 text-xs text-gray-600 bg-white/60 dark:bg-neutral-800/60 border rounded-lg px-3 py-2">
          <div>전체 <span className="font-semibold">{stats.total}</span></div>
          <div>공개 <span className="font-semibold text-emerald-600">{stats.pub}</span></div>
            <div>비공개 <span className="font-semibold text-gray-500">{stats.priv}</span></div>
          <div>평균감정 <span className="font-semibold">{stats.avg}</span></div>
        </div>
        <Link href="/diary/new" className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500">
          새 일기 작성
        </Link>
      </header>

      <DiaryFilterBar onChange={handleFilterChange} loading={loading && !initialLoading} />

      {error && (
        <div className="p-4 border border-red-300 bg-red-50 text-sm text-red-700 rounded">
          {error}
          <button onClick={() => { setError(""); loadPage(true); }} className="ml-3 underline">재시도</button>
        </div>
      )}

      {initialLoading ? (
        <DiaryListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <section aria-label="일기 목록" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <DiaryCard
              key={d.id}
              id={d.id}
              question={d.question}
              content={d.content}
              createdAt={d.createdAt}
              emotionScore={d.emotionScore}
              isPublic={d.isPublic}
              mediaUrl={d.mediaUrl}
              mediaType={d.mediaType}
              highlight={filter.query}
              onClick={() => window.location.href = `/diary/${d.id}`}
            />
          ))}
        </section>
      )}

      <div ref={observerRef} className="h-8" />
      {loading && !initialLoading && (
        <div className="text-center text-xs text-gray-500 pb-6">불러오는 중...</div>
      )}
      {!hasMore && !initialLoading && filtered.length > 0 && (
        <div className="text-center text-[11px] text-gray-400 pb-6">마지막 일기까지 모두 확인했습니다.</div>
      )}
    </div>
  );
}

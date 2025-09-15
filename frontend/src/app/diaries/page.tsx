"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';

interface PopularDiaryItem {
  id: string;
  content: string;
  createdAt: string;
  diaryDate?: string;
  emotion?: string;
  emotionScore?: number;
  likes?: number;
  username?: string;
}

// 감정 점수 -> 이모지 fallback
const scoreToEmoji = (score?: number) => {
  if (score == null) return '📝';
  if (score >= 8) return '😊';
  if (score >= 6) return '🤩';
  if (score >= 4) return '😌';
  if (score >= 2) return '😢';
  return '😠';
};

export default function PopularDiariesPage() {
  const router = useRouter();
  const [items, setItems] = useState<PopularDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 필터 상태
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 감정 옵션 (이모지 또는 코드)
  const emotionOptions = [
    { value: 'all', label: '전체' },
    { value: '😊', label: '😊' },
    { value: '🤩', label: '🤩' },
    { value: '😌', label: '😌' },
    { value: '😢', label: '😢' },
    { value: '😠', label: '😠' },
    { value: '📝', label: '📝(미분류)' },
  ];

  const resetFilters = () => {
    setEmotionFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const withinDate = useCallback((dateStr: string) => {
    if (!startDate && !endDate) return true;
    const t = new Date(dateStr).getTime();
    if (startDate) {
      const s = new Date(startDate).getTime();
      if (t < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate).getTime() + 24*60*60*1000 - 1; // end inclusive
      if (t > e) return false;
    }
    return true;
  }, [startDate, endDate]);

  const filteredItems = useMemo(() => {
    return items.filter(d => {
      const emoji = d.emotion || scoreToEmoji(d.emotionScore);
      if (emotionFilter !== 'all') {
        if (emotionFilter === '📝') {
          // 미분류: emotion/score 없는 경우만
            if (d.emotion || d.emotionScore != null) return false;
        } else if (emoji !== emotionFilter) return false;
      }
      if (!withinDate(d.createdAt)) return false;
      return true;
    });
  }, [items, emotionFilter, withinDate]);

  useEffect(() => {
    setLoading(true);
    api.get('/diaries?sort=popularity&limit=30')
      .then(res => setItems(res.data.diaries || []))
      .catch(() => setError('인기 일기를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/dashboard');
              }
            }}
            aria-label="뒤로 가기"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span>뒤로</span>
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">🔥 인기 일기 <span className="text-xs font-normal text-gray-500">(상위 {items.length}건)</span></h1>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <div className="flex flex-col gap-1 w-full md:w-40">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">감정</label>
          <select
            value={emotionFilter}
            onChange={e => setEmotionFilter(e.target.value)}
            className="h-9 rounded-md border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
          >
            {emotionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">시작일</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={e => setStartDate(e.target.value)}
            className="h-9 rounded-md border-gray-300 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">종료일</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={e => setEndDate(e.target.value)}
            className="h-9 rounded-md border-gray-300 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={resetFilters}
            className="h-9 px-4 rounded-md border text-sm font-medium bg-white hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
          >리셋</button>
        </div>
        <div className="md:ml-auto text-xs text-gray-500 font-medium">결과: {filteredItems.length}건</div>
      </div>

      {loading && <div className="text-sm text-gray-500">불러오는 중...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-gray-500">아직 인기 일기가 없습니다.</div>
      )}

      <ul className="space-y-4">
        {filteredItems.map((d, idx) => {
          const emoji = d.emotion || scoreToEmoji(d.emotionScore);
          const handleNavigate = () => { window.location.href = `/diary/${d.id}`; };
          const handleKey = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigate();
            }
          };
          return (
            <li
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={handleNavigate}
              onKeyDown={handleKey}
              className="group bg-white rounded-xl p-4 shadow hover:shadow-md transition relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 hover:bg-gray-50"
              aria-label={`일기 ${idx + 1}위 보기`}
            >
              <span className="absolute -top-2 -left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{idx + 1}</span>
              <div className="flex items-center justify-between mb-2 pr-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" title={d.username || '익명'}>{d.username || '익명'}</p>
                    <p className="text-[11px] text-gray-500 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString('ko-KR')} · ❤️ {d.likes ?? 0}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-800 font-medium line-clamp-1 mb-1" title={d.content}>{d.content}</p>
              <p className="text-[12px] text-gray-600 line-clamp-2" title={d.content}>{d.content}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

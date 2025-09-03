"use client";
import { useEffect, useState } from 'react';
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
  const [items, setItems] = useState<PopularDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/diaries?sort=popularity&limit=30')
      .then(res => setItems(res.data.diaries || []))
      .catch(() => setError('인기 일기를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🔥 인기 일기</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">대시보드로</Link>
      </div>

      {loading && <div className="text-sm text-gray-500">불러오는 중...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-gray-500">아직 인기 일기가 없습니다.</div>
      )}

      <ul className="space-y-4">
        {items.map((d, idx) => {
          const emoji = d.emotion || scoreToEmoji(d.emotionScore);
          return (
            <li key={d.id} className="bg-white rounded-xl p-4 shadow hover:shadow-md transition relative">
              <span className="absolute -top-2 -left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{idx + 1}</span>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{d.username || '익명'}</p>
                    <p className="text-[11px] text-gray-500">{new Date(d.createdAt).toLocaleDateString('ko-KR')} · ❤️ {d.likes ?? 0}</p>
                  </div>
                </div>
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => { window.location.href = `/diary/${d.id}`; }}
                >보기</button>
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

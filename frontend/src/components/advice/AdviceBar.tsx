"use client";
import React, { useEffect, useState } from 'react';
import { adviceApi } from '@/services/advice-api';

type AdviceBarProps = {
  variant?: 'fixed' | 'inline';
  title?: string;
};

export default function AdviceBar({ variant = 'fixed', title }: AdviceBarProps) {
  const [text, setText] = useState<string>('오늘의 한마디를 불러오는 중...');
  const [risk, setRisk] = useState<'none'|'mild'|'moderate'|'severe'>('none');
  const [loading, setLoading] = useState(false);
  const [adviceId, setAdviceId] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    try {
      // 우선 캐시 최신 조회
      const data = force ? await adviceApi.generate(true) : await adviceApi.latest();
      setText(data.advice);
      setRisk(data.risk_flag || 'none');
      setAdviceId(data.id);
    } catch (e) {
      setText('작게 시작해도 좋아요—오늘은 5분만 쉬어가요.');
      setRisk('none');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(false); }, []);

  const sendFeedback = async (helpful: boolean) => {
    if (!adviceId) return;
    try {
      await adviceApi.feedback(adviceId, helpful);
      setToast(helpful ? '도움이 되었어요. 고마워요!' : '피드백 반영할게요.');
      setTimeout(()=> setToast(null), 1800);
    } catch {}
  };

  const content = (
      <div className="w-full bg-white shadow-md border rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="text-yellow-600">💡</div>
        <div className="flex-1 text-sm text-gray-800 truncate" title={text}>{text}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => sendFeedback(true)} disabled={!adviceId} className="text-green-600 text-xs">👍</button>
          <button onClick={() => sendFeedback(false)} disabled={!adviceId} className="text-gray-500 text-xs">👎</button>
        </div>
        <button onClick={() => load(true)} disabled={loading} className="text-gray-600 hover:text-gray-800">⟲</button>
        {risk === 'severe' && (
          <button onClick={() => alert('도움 받기: 가까운 사람/전문기관과 연결할 수 있는 안내 페이지로 이동합니다.')} className="ml-1 text-red-600 text-xs border border-red-200 rounded px-2 py-1">도움 받기</button>
        )}
      </div>
  );

  if (variant === 'inline') {
    return (
      <div className="px-1">
        <div className="max-w-3xl mx-auto">
          {title && <div className="text-sm font-semibold text-gray-700 mb-2">{title}</div>}
          {content}
          {toast && (
            <div className="mt-2 flex justify-center">
              <div className="bg-black/80 text-white text-xs px-3 py-1 rounded-full">{toast}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3">
      <div className="mx-auto max-w-md">
        {content}
        {toast && (
          <div className="mt-2 flex justify-center">
            <div className="bg-black/80 text-white text-xs px-3 py-1 rounded-full">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

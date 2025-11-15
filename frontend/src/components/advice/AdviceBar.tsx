"use client";
import React, { useEffect, useState } from 'react';
import { adviceApi } from '@/services/advice-api';

type AdviceBarProps = {
  variant?: 'fixed' | 'inline';
  title?: string;
  // inline 변형에서 페이지 카드들과 같은 너비로 꽉 차게 표시
  fullWidth?: boolean;
};

export default function AdviceBar({ variant = 'fixed', title, fullWidth = false }: AdviceBarProps) {
  const [text, setText] = useState<string>('오늘의 한마디를 불러오는 중...');
  const [risk, setRisk] = useState<'none'|'mild'|'moderate'|'severe'>('none');
  const [loading, setLoading] = useState(false);
  const [adviceId, setAdviceId] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const fallbackAdvice = '작게 시작해도 좋아요—오늘은 5분만 쉬어가요.';

  const applyAdvice = (payload?: { advice?: string; risk_flag?: 'none'|'mild'|'moderate'|'severe'; id?: string }) => {
    if (payload?.advice && payload.advice.trim().length > 0) {
      setText(payload.advice);
      setRisk(payload.risk_flag || 'none');
      setAdviceId(payload.id);
    } else {
      setText(fallbackAdvice);
      setRisk('none');
      setAdviceId(undefined);
    }
  };

  const load = async (force = false) => {
    setLoading(true);
    try {
      // 우선 캐시 최신 조회
      const data = force ? await adviceApi.generate(true) : await adviceApi.latest();
      applyAdvice(data);
    } catch (e: any) {
      applyAdvice();
      if (force) {
        const message = typeof e?.message === 'string' && e.message.includes('요청이 너무 잦아요')
          ? '너무 빨리 새로고침 했어요. 잠시 후 다시 시도해 주세요.'
          : '새로운 조언을 가져오지 못했어요.';
        setToast(message);
        setTimeout(() => setToast(null), 1800);
      }
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
      {/* 아이콘 */}
      <div className="text-yellow-600" aria-hidden>💡</div>
      {/* 제목 배지 - 바 내부에 배치 */}
      {title && (
        <span
          className="whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200"
          aria-label={title}
        >
          {title}
        </span>
      )}
      {/* 본문 텍스트 */}
      <div className="flex-1 text-sm text-gray-800 truncate" title={text}>
        {text}
      </div>
      {/* 액션 버튼들 */}
      <div className="flex items-center gap-1">
        <button onClick={() => sendFeedback(true)} disabled={!adviceId} className="text-green-600 text-xs" aria-label="도움이 되었어요">👍</button>
        <button onClick={() => sendFeedback(false)} disabled={!adviceId} className="text-gray-500 text-xs" aria-label="별로였어요">👎</button>
      </div>
      <button onClick={() => load(true)} disabled={loading} className="text-gray-600 hover:text-gray-800" aria-label="새로고침">⟲</button>
      {risk === 'severe' && (
        <button
          onClick={() => alert('도움 받기: 가까운 사람/전문기관과 연결할 수 있는 안내 페이지로 이동합니다.')}
          className="ml-1 text-red-600 text-xs border border-red-200 rounded px-2 py-1"
        >
          도움 받기
        </button>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={fullWidth ? '' : 'px-1'}>
        <div className={fullWidth ? '' : 'max-w-3xl mx-auto'}>
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

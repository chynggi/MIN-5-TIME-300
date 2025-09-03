"use client";
import Link from "next/link";
import { memo, useMemo } from "react";

interface DiaryCardProps {
  id: string;
  question?: string;
  content: string;
  createdAt: string;
  emotionScore?: number;
  isPublic: boolean;
  mediaUrl?: string;
  mediaType?: string;
  onClick?: () => void;
  highlight?: string; // 검색어 하이라이트
}

function highlightText(text: string, keyword?: string) {
  if (!keyword) return text;
  const parts = text.split(new RegExp(`(${keyword})`, "gi"));
  return parts.map((part, i) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark>;
    }
    return part;
  });
}

const EmotionBadge = ({ score }: { score?: number }) => {
  if (score === undefined || score === null) return null;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-blue-500" : "bg-gray-500";
  return (
    <span className={`text-[10px] inline-flex items-center px-2 py-0.5 rounded-full text-white ${color}`}>감정 {score}</span>
  );
};

const VisibilityBadge = ({ isPublic }: { isPublic: boolean }) => (
  <span className={`text-[10px] inline-flex items-center px-2 py-0.5 rounded-full border ${isPublic ? "border-emerald-400 text-emerald-600" : "border-gray-400 text-gray-500"}`}>
    {isPublic ? "공개" : "비공개"}
  </span>
);

export const DiaryCard = memo(function DiaryCard({ id, question, content, createdAt, emotionScore, isPublic, mediaUrl, mediaType, onClick, highlight }: DiaryCardProps) {
  const dateLabel = useMemo(() => new Date(createdAt).toLocaleString(), [createdAt]);
  const hasImage = mediaUrl && mediaType?.includes("image");
  const hasAudio = mediaUrl && mediaType?.includes("audio");

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick(); }}
  className="group relative flex flex-col border rounded-lg p-4 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm shadow-sm hover:shadow-md transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer"
    >
      <div className="flex items-start gap-2 mb-2">
        <h3 className="font-semibold text-sm line-clamp-2 flex-1 leading-snug">{highlightText(question || '질문 없음', highlight)}</h3>
        <div className="flex flex-col items-end gap-1 ml-2">
          <VisibilityBadge isPublic={isPublic} />
          <EmotionBadge score={emotionScore} />
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3 leading-relaxed">
        {highlightText(content, highlight)}
      </p>
      <div className="mt-auto flex items-center justify-between text-[11px] text-gray-400">
        <span>{dateLabel}</span>
        <span className="flex items-center gap-1 text-gray-500">
          {hasImage && <span aria-label="이미지 포함" title="이미지">📷</span>}
          {hasAudio && <span aria-label="오디오 포함" title="오디오">🎤</span>}
          <Link href={`/diary/${id}`} className="opacity-0 group-hover:opacity-100 transition text-blue-600 text-[11px] underline ml-1">보기</Link>
        </span>
      </div>
    </div>
  );
});

export default DiaryCard;

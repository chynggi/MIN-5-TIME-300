"use client";
import React from 'react';

type Props = {
  percent: number; // 0~100
  onCheck: () => void;
  disabled?: boolean;
};

function colorFor(percent: number) {
  if (percent >= 100) return 'bg-green-500';
  if (percent >= 70) return 'bg-blue-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
}

export default function TemperatureBar({ percent, onCheck, disabled }: Props) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="mb-4 rounded-xl border border-gray-200 p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">하루의 온도</div>
        <button
          onClick={onCheck}
          disabled={disabled}
          className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Check
        </button>
      </div>
      <div className="mt-2 w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`${colorFor(safe)} h-3 transition-all`} style={{ width: `${safe}%` }} />
      </div>
      <div className="text-right text-[11px] text-gray-600 mt-1">{safe}%</div>
    </div>
  );
}

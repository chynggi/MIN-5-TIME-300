"use client";
import { useState } from "react";

interface WritingModeProps {
  onModeSelect: (mode: "question" | "free") => void;
}

export default function WritingMode({ onModeSelect }: WritingModeProps) {
  const [selectedMode, setSelectedMode] = useState<"question" | "free" | null>(null);

  const handleModeSelect = (mode: "question" | "free") => {
    setSelectedMode(mode);
    onModeSelect(mode);
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">일기 작성 방식</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleModeSelect("question")}
          className={`p-4 rounded-lg border-2 text-center transition-colors ${
            selectedMode === "question"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-500 hover:bg-gray-600"
          } text-white`}
        >
          <div className="text-2xl mb-2">❓</div>
          <div className="font-semibold text-sm">질문 제공 형식</div>
          <div className="text-xs opacity-80 mt-1">
            AI가 제공하는 질문에 답하며 일기 작성
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleModeSelect("free")}
          className={`p-4 rounded-lg border-2 text-center transition-colors ${
            selectedMode === "free"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-500 hover:bg-gray-600"
          } text-white`}
        >
          <div className="text-2xl mb-2">✍️</div>
          <div className="font-semibold text-sm">자유 형식</div>
          <div className="text-xs opacity-80 mt-1">
            자유롭게 생각을 적는 일기 작성
          </div>
        </button>
      </div>

      {selectedMode && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            {selectedMode === "question" 
              ? "AI가 생성한 질문에 답하며 일기를 작성합니다."
              : "자유롭게 오늘의 이야기를 들려주세요."
            }
          </div>
        </div>
      )}
    </div>
  );
}

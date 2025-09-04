"use client";
import { useState } from "react";

interface FreeWriterProps {
  onComplete: (data: { title: string; content: string }) => void;
  onBack: () => void;
  initialTitle?: string;
  initialContent?: string;
}

export default function FreeWriter({ onComplete, onBack, initialTitle = "", initialContent = "" }: FreeWriterProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const handleComplete = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    onComplete({ title, content });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-gray-800">자유 형식 일기 작성</h2>
        <p className="text-sm text-gray-600 mt-1">오늘의 이야기를 자유롭게 들려주세요</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">일기 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={100}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {title.length}/100자
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">일기 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어떠셨나요? 자유롭게 이야기해주세요..."
          className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] resize-none"
          maxLength={2000}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {content.length}/2000자
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-1">💡 작성 팁</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 오늘 있었던 특별한 일이나 감정을 솔직하게 적어보세요</li>
          <li>• 작은 일상의 순간들도 소중한 기록이 됩니다</li>
          <li>• 미래의 나에게 전하고 싶은 메시지를 담아보세요</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
        >
          뒤로가기
        </button>
        <button
          onClick={handleComplete}
          disabled={!title.trim() || !content.trim()}
          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          작성 완료
        </button>
      </div>
    </div>
  );
}

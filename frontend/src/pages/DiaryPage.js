import React, { useState, useEffect } from "react";

function DiaryPage() {
  const [diary, setDiary] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5분 타이머

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-primary mb-4">📝 일기 작성</h1>
      <p className="text-lg text-gray-700">남은 시간: <span className="font-bold text-red-500">{Math.floor(timeLeft / 60)}분 {timeLeft % 60}초</span></p>
      
      <div className="relative w-full max-w-lg my-4">
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary"
          rows="5"
          placeholder="오늘 하루를 기록해 보세요..."
          value={diary}
          onChange={(e) => setDiary(e.target.value)}
        />
      </div>

      <button
        className="px-6 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
        disabled={timeLeft <= 0}
      >
        ✨ 제출
      </button>
    </div>
  );
}

export default DiaryPage;

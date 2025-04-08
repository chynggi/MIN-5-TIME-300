"use client";

import { Calendar } from "@/components/calendar";
import { MainNavigation } from "@/components/main-navigation";
import { UserAvatars } from "@/components/user-avatars";
import { useState, useEffect } from "react";
import { checkDiaryStatus, checkMessageStatus } from "@/lib/api/status";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const [showDiaryMessage, setShowDiaryMessage] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showQuestionMessage, setShowQuestionMessage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchStatuses() {
      try {
        const diaryStatus = await checkDiaryStatus();
        const messageStatus = await checkMessageStatus();

        setShowDiaryMessage(!diaryStatus.hasWrittenToday);
        setShowNewMessage(messageStatus.hasNewMessages);
        setShowQuestionMessage(messageStatus.hasUnansweredQuestions);
      } catch (error) {
        console.error("Error fetching statuses:", error);
      }
    }

    fetchStatuses();
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="font-bold">5MIN</span>
          </div>
        </div>
      </header>

      <main className="space-y-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-card rounded-xl">
            <UserAvatars />
          </div>
          <div className="p-4 bg-card rounded-xl">
            <Calendar />
          </div>
          <div className="space-y-4">
            {showDiaryMessage && (
              <div className="p-4 bg-yellow-100 rounded-xl">
                <p className="text-sm text-yellow-800">오늘의 일기를 작성해보세요!</p>
              </div>
            )}
            {showNewMessage && (
              <div className="p-4 bg-pink-100 rounded-xl">
                <p className="text-sm text-pink-800">새로운 메시지가 도착했어요.</p>
              </div>
            )}
            {showQuestionMessage && (
              <div className="p-4 bg-green-100 rounded-xl">
                <p className="text-sm text-green-800">질문에 답변해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


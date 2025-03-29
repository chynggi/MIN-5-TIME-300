"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Timer } from "@/components/timer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { questionAPI, diaryAPI } from "@/lib/api"

export default function Home() {
  const [entry, setEntry] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [isShared, setIsShared] = useState(false)
  const [dailyPrompt, setDailyPrompt] = useState("What made you feel grateful today?")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  
  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  // 일일 질문 가져오기
  useEffect(() => {
    const fetchDailyQuestion = async () => {
      try {
        const response = await questionAPI.getDailyQuestion()
        if (response.data && response.data.question) {
          setDailyPrompt(response.data.question)
        }
      } catch (err) {
        console.error("Failed to fetch daily question:", err)
      }
    }
    
    fetchDailyQuestion()
  }, [])

  const handleTimerComplete = () => {
    // 타이머 완료 시 자동 제출
    if (entry.trim() && !isSubmitted) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion)
  }

  const handleSaveJournal = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 감정을 숫자로 변환 (백엔드 API에 맞게)
      let rating = 5 // 기본값
      if (selectedEmotion === "😊") rating = 5
      else if (selectedEmotion === "😌") rating = 4
      else if (selectedEmotion === "😐") rating = 3
      else if (selectedEmotion === "😢") rating = 2
      else if (selectedEmotion === "😡") rating = 1
      
      await diaryAPI.submitEntry(entry, isShared, rating)
      
      // 성공 시 폼 초기화
      setEntry("")
      setIsSubmitted(false)
      setSelectedEmotion(null)
      setIsShared(false)
      
      // 새로운 질문 로드
      const response = await questionAPI.getDailyQuestion()
      if (response.data && response.data.question) {
        setDailyPrompt(response.data.question)
      }
      
    } catch (err: any) {
      console.error("Failed to save journal:", err)
      setError(err.response?.data?.message || "Failed to save your journal entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">오늘의 5분 일기</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">오늘의 질문:</h2>
          <p className="text-slate-600 dark:text-slate-300">{dailyPrompt}</p>
        </div>

        {!isSubmitted ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="journal" className="text-lg font-medium">
                  당신의 생각을 적어주세요
                </label>
                <Timer duration={300} onComplete={handleTimerComplete} />
              </div>
              <Textarea
                id="journal"
                placeholder="여기에 작성하세요..."
                className="min-h-[200px]"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!entry.trim()}
              className="w-full"
            >
              완료
            </Button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-lg font-medium mb-2 block">
                당신의 오늘은 어땠나요?
              </label>
              <div className="flex justify-between text-3xl mt-4">
                <button
                  onClick={() => handleEmotionSelect("😡")}
                  className={`p-2 rounded-full ${
                    selectedEmotion === "😡"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  😡
                </button>
                <button
                  onClick={() => handleEmotionSelect("😢")}
                  className={`p-2 rounded-full ${
                    selectedEmotion === "😢"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  😢
                </button>
                <button
                  onClick={() => handleEmotionSelect("😐")}
                  className={`p-2 rounded-full ${
                    selectedEmotion === "😐"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  😐
                </button>
                <button
                  onClick={() => handleEmotionSelect("😌")}
                  className={`p-2 rounded-full ${
                    selectedEmotion === "😌"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  😌
                </button>
                <button
                  onClick={() => handleEmotionSelect("😊")}
                  className={`p-2 rounded-full ${
                    selectedEmotion === "😊"
                      ? "bg-slate-200 dark:bg-slate-700"
                      : ""
                  }`}
                >
                  😊
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="share"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
                <Label htmlFor="share">커뮤니티에 공유하기</Label>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full"
                disabled={isLoading}
              >
                뒤로
              </Button>
              <Button
                onClick={handleSaveJournal}
                className="w-full"
                disabled={!selectedEmotion || isLoading}
              >
                {isLoading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
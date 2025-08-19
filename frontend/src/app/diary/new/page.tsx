"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";
import { SpotifyTrack as SpotifyTrackType, DiarySettings as DiarySettingsType } from "@/types/diary";

// Import new components
import ImageUpload from "@/components/diary/ImageUpload";
import EmotionVoice from "@/components/diary/EmotionVoice";
import MusicSetting from "@/components/diary/MusicSetting";
import WritingMode from "@/components/diary/WritingMode";
import DiarySettings from "@/components/diary/DiarySettings";
import AIQuestionWriter from "@/components/diary/AIQuestionWriter";
import FreeWriter from "@/components/diary/FreeWriter";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    images: { url: string }[];
  };
}

export default function NewDiaryPage() {
  const router = useRouter();
  
  // Current view state
  const [currentView, setCurrentView] = useState<"main" | "ai-question" | "free-write" | "settings">("main");
  
  // Main form data
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [emotion, setEmotion] = useState("😊");
  const [voiceRecord, setVoiceRecord] = useState<Blob | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<SpotifyTrack | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questionId, setQuestionId] = useState("");
  
  // Settings
  const [diarySettings, setDiarySettings] = useState({
    postVisibility: "public" as "private" | "public" | "friends",
    contentVisibility: "public" as "public" | "private",
    weather: "sunny" as "sunny" | "cloudy" | "rainy" | "snowy"
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (file: File | null) => {
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleWritingModeSelect = (mode: "question" | "free") => {
    if (mode === "question") {
      setCurrentView("ai-question");
    } else {
      setCurrentView("free-write");
    }
  };

  const handleAIQuestionComplete = (data: { title: string; content: string; questionId: string }) => {
    setTitle(data.title);
    setContent(data.content);
    setQuestionId(data.questionId);
    setCurrentView("main");
  };

  const handleFreeWriteComplete = (data: { title: string; content: string }) => {
    setTitle(data.title);
    setContent(data.content);
    setCurrentView("main");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("emotion", emotion);
      formData.append("postVisibility", diarySettings.postVisibility);
      formData.append("contentVisibility", diarySettings.contentVisibility);
      formData.append("weather", diarySettings.weather);
      
      if (questionId) formData.append("questionId", questionId);
      if (image) formData.append("image", image);
      if (voiceRecord) formData.append("voice", voiceRecord);
      if (selectedMusic) formData.append("musicData", JSON.stringify(selectedMusic));

      const response = await api.post("/diaries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.status === 200 || response.status === 201) {
        alert("일기가 성공적으로 저장되었습니다!");
        router.push("/dashboard");
      } else {
        throw new Error("저장 실패");
      }
    } catch (err: any) {
      console.error("일기 저장 오류:", err);
      setError(err.response?.data?.message || "일기 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Main composition view
  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">오늘의 일기</h1>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('ko-KR')}</span>
          </div>

          {/* Image Upload Component */}
          <ImageUpload onImageSelect={handleImageSelect} preview={preview} />

          {/* Emotion & Voice Component */}
          <EmotionVoice 
            emotion={emotion}
            onEmotionChange={setEmotion}
            onVoiceRecord={setVoiceRecord}
          />

          {/* Music Setting Component */}
          <MusicSetting 
            onMusicSelect={setSelectedMusic}
            selectedTrack={selectedMusic}
          />

          {/* Writing Mode Selection */}
          <WritingMode onModeSelect={handleWritingModeSelect} />

          {/* Diary Settings Button */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">일기 설정</h3>
                <p className="text-xs text-gray-500 mt-1">
                  공개범위: {diarySettings.postVisibility === "private" ? "🔒 비공개" : 
                           diarySettings.postVisibility === "public" ? "🌍 전체공개" : "👥 친구공개"} | 
                  날씨: {diarySettings.weather === "sunny" ? "☀️ 맑음" : 
                        diarySettings.weather === "cloudy" ? "☁️ 흐림" : 
                        diarySettings.weather === "rainy" ? "🌧️ 비" : "❄️ 눈"}
                </p>
              </div>
              <button
                onClick={() => setCurrentView("settings")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                설정 변경
              </button>
            </div>
          </div>

          {/* Content Preview (if written) */}
          {(title || content) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">작성된 일기</h3>
              {title && (
                <div className="mb-2">
                  <div className="text-xs text-gray-600">제목:</div>
                  <div className="font-semibold">{title}</div>
                </div>
              )}
              {content && (
                <div>
                  <div className="text-xs text-gray-600">내용:</div>
                  <div className="text-sm text-gray-700 line-clamp-3">{content}</div>
                </div>
              )}
              <button
                onClick={() => {
                  if (questionId) {
                    setCurrentView("ai-question");
                  } else {
                    setCurrentView("free-write");
                  }
                }}
                className="text-xs text-blue-600 underline mt-2"
              >
                수정하기
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <Link 
              href="/dashboard" 
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg text-center hover:bg-gray-500"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "저장 중..." : "일기 저장"}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-red-500 text-sm text-center">{error}</div>
          )}
        </div>
      </div>
    );
  }

  // AI Question Writing view
  if (currentView === "ai-question") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <AIQuestionWriter 
            onComplete={handleAIQuestionComplete}
            onBack={() => setCurrentView("main")}
          />
        </div>
      </div>
    );
  }

  // Free Writing view
  if (currentView === "free-write") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <FreeWriter 
            onComplete={handleFreeWriteComplete}
            onBack={() => setCurrentView("main")}
          />
        </div>
      </div>
    );
  }

  // Settings view
  if (currentView === "settings") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">일기 설정</h1>
            <button
              onClick={() => setCurrentView("main")}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <DiarySettings 
            settings={diarySettings}
            onSettingsChange={setDiarySettings}
          />
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setCurrentView("main")}
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg text-center hover:bg-gray-500"
            >
              취소
            </button>
            <button
              onClick={() => setCurrentView("main")}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              설정 완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

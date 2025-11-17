"use client";
import { useState, useEffect, Suspense } from "react";
// 기본 제공 이미지들 (예시)
const defaultImages = [
  "/images/def/default1.jpg",
  "/images/def/default2.jpg",
];
import { useRouter, useSearchParams } from "next/navigation";
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
import TemperatureBar from "@/components/checkin/TemperatureBar";
import CheckinForm from "@/components/checkin/CheckinForm";
import { checkinApi } from "@/services/checkin-api";


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

function NewDiaryContent() {
  const router = useRouter();

  // View states
  const [currentView, setCurrentView] = useState<"main" | "ai-question" | "free-write" | "settings">("main");

  // Core form states
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState<string | null>(null); // 프리셋 기본 이미지 키
  const [showDefaultImageSelect, setShowDefaultImageSelect] = useState(false);
  const [emotion, setEmotion] = useState("😊");
  const [voiceRecord, setVoiceRecord] = useState<Blob | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<SpotifyTrack | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [questionModel, setQuestionModel] = useState("");
  const [startTime] = useState<number>(Date.now());
  // Check-in/온도 바 상태
  const [checkinPercent, setCheckinPercent] = useState<number>(0);
  const [showCheckinForm, setShowCheckinForm] = useState<boolean>(false);

  // Date param handling
  const searchParams = useSearchParams();
  const initialDateParam = searchParams?.get('date');
  const todayStr = new Date().toISOString().split('T')[0];
  const parseValidDate = (d?: string | null) => {
    if (!d) return todayStr;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return todayStr;
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt.getTime())) return todayStr;
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dt > todayMid) return todayStr;
    return d;
  };
  const [selectedDate, setSelectedDate] = useState<string>(parseValidDate(initialDateParam));
  useEffect(() => {
    const newParam = searchParams?.get('date');
    setSelectedDate(parseValidDate(newParam));
  }, [searchParams]);

  // 오늘(또는 선택 날짜)의 체크인 퍼센트 조회
  useEffect(() => {
    let mounted = true;
    checkinApi.getToday(selectedDate).then((res) => {
      if (!mounted) return;
      setCheckinPercent(res?.percent ?? 0);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [selectedDate]);

  // Diary settings
  const [diarySettings, setDiarySettings] = useState({
    postVisibility: "public" as "private" | "public" | "friends",
    contentVisibility: "public" as "public" | "private",
    weather: "sunny" as "sunny" | "cloudy" | "rainy" | "snowy"
  });

  // Location related
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'success' | 'denied' | 'error'>('idle');
  // 전역 개인정보 설정(프로필>설정>개인정보)의 '위치 정보 자동 저장' 토글을 사용
  const [shareLocation, setShareLocation] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // SSR 방어 기본 true
    try {
      const stored = localStorage.getItem('shareLocationEnabled');
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });
  useEffect(() => {
    if (!shareLocation) return;
    if (!('geolocation' in navigator)) { setLocationStatus('error'); return; }
    setLocationStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationStatus('success');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocationStatus('denied'); else setLocationStatus('error');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  }, [shareLocation]);

  // Misc states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 질문형 작성 선택 질문 보관
  const [selectedQuestions, setSelectedQuestions] = useState<Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }>>([]);

  // Handlers
  const handleImageSelect = (file: File | null) => {
    setImage(file);
    if (file) { setPreview(URL.createObjectURL(file)); setShowDefaultImageSelect(false); }
    else { setPreview(null); }
  };
  const handleDefaultImageSelect = (url: string) => { setImage(null); setPreview(url); setShowDefaultImageSelect(false); };
  const handleWritingModeSelect = (mode: "question" | "free") => { setCurrentView(mode === 'question' ? 'ai-question' : 'free-write'); };
  const handleAIQuestionComplete = (data: { title: string; content: string; questionId: string; questionModel?: string; selectedQuestions: Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }> }) => { 
    setTitle(data.title); 
    setContent(data.content); 
    setQuestionId(data.questionId); 
    if (data.questionModel) setQuestionModel(data.questionModel);
    setSelectedQuestions(data.selectedQuestions || []);
    setCurrentView('main'); 
  };
  const handleFreeWriteComplete = (data: { title: string; content: string }) => { setTitle(data.title); setContent(data.content); setCurrentView('main'); };

  const handleSubmit = async () => {
    if (checkinPercent < 100) {
      setError('하루의 온도 체크인을 완료해야 일기 저장이 가능합니다. 상단의 Check 버튼을 눌러 설문을 저장해주세요.');
      return;
    }
    if (!title.trim() || !content.trim()) { setError("제목과 내용을 모두 입력해주세요."); return; }
    if (!image && !preview) { 
      setShowDefaultImageSelect(true); 
      setError("이미지를 추가하거나 기본 이미지 중 하나를 선택해주세요."); 
      return; 
    }
    setLoading(true); setError("");
    try {
      const writingDuration = Math.floor((Date.now() - startTime) / 1000);
      const formData = new FormData();
      const combinedContent = title ? `[제목] ${title}\n\n${content}` : content;
      formData.append("content", combinedContent);
      formData.append("emotion", emotion);
      formData.append("diaryDate", selectedDate);
      formData.append("writingDuration", writingDuration.toString());
      const isPublic = diarySettings.postVisibility !== 'private';
      formData.append('isPublic', isPublic.toString());
      if (shareLocation && lat != null && lng != null) { formData.append('lat', lat.toString()); formData.append('lng', lng.toString()); }
  if (questionId) formData.append('questionId', questionId);
  if (questionModel) formData.append('questionModel', questionModel);
      // 이미지 처리: 업로드 파일 > preset 키 > (예외) preview만 존재 시 fetch
      if (image) {
        formData.append('file', image);
      } else if (presetKey) {
        formData.append('preset', presetKey);
      } else if (preview) {
        // 예외 케이스: presetKey가 없지만 preview 경로만 있는 경우 (레거시/임시)
        if (preview.startsWith('/images/')) {
          // 경로에서 키 유추 (예: /images/seasons/spring.jpg)
          const match = preview.match(/\/images\/(?:seasons|weather)\/(.+)\.(?:jpg|png|jpeg|webp)$/);
          if (match) {
            formData.append('preset', match[1]);
          } else {
            // 마지막 fallback: fetch 업로드 (빈번하진 않음)
            try {
              const abs = typeof window !== 'undefined' ? `${window.location.origin}${preview}` : preview;
              const res = await fetch(abs, { cache: 'no-store' });
              if (res.ok) {
                const blob = await res.blob();
                const fileName = preview.split('/').pop() || 'image.jpg';
                formData.append('file', new File([blob], fileName, { type: blob.type || 'image/jpeg' }));
              }
            } catch {/* ignore */}
          }
        }
      }
      // 선택 질문 배열 동봉(JSON 문자열로 전송 -> 서버에서 정규화)
      if (selectedQuestions && selectedQuestions.length > 0) {
        const domains = selectedQuestions.map(q => q.domain);
        const texts = selectedQuestions.map(q => q.text);
        formData.append('selectedQuestionDomains', JSON.stringify(domains));
        formData.append('selectedQuestionTexts', JSON.stringify(texts));
      }
      const response = await api.post("/diaries", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.status === 200 || response.status === 201) { 
        alert("일기가 성공적으로 저장되었습니다!\n(질문 기반 작성 내용은 자연스러운 일기 형태로 요약/정리되어 저장되었습니다.)"); 
        router.push('/dashboard'); 
      }
      else { throw new Error('저장 실패'); }
    } catch (err: any) {
      console.error('일기 저장 오류:', err?.response?.data || err);
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) setError(`저장 실패: ${serverMsg}`);
      else if (err?.response?.status === 400) setError('요청 형식이 올바르지 않습니다. 필수 항목을 다시 확인해주세요.');
      else setError('일기 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally { setLoading(false); }
  };

  // Main composition view
  if (currentView === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          {/* 상단 날짜 설정 섹션 제거됨 (요청사항) */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-800">오늘의 일기</h1>
          </div>

          {/* 하루의 온도 바 */}
          <TemperatureBar
            percent={checkinPercent}
            onCheck={() => setShowCheckinForm(true)}
          />

          {/* 설문 폼 모달 대체: 간단히 조건부 렌더링 */}
          {showCheckinForm && (
            // Allow vertical scrolling so bottom actions remain reachable on small screens
            <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto py-6 z-50">
              <div className="w-full max-w-md p-4">
                <CheckinForm
                  defaultDate={selectedDate}
                  onSaved={(r) => { setCheckinPercent(r.percent); setShowCheckinForm(false); }}
                  onCancel={() => setShowCheckinForm(false)}
                />
              </div>
            </div>
          )}


          {/* Image Upload Component */}
          <ImageUpload
            onImageSelect={(file) => { setImage(file); if (file) { setPresetKey(null); } }}
            preview={preview}
            onDefaultImageSelect={(url, key) => {
              setPreview(url);
              setPresetKey(key || null);
              setImage(null);
              setShowDefaultImageSelect(false);
              setError('');
            }}
          />
          {showDefaultImageSelect && !preview && (
            <div className="my-4">
              <div className="text-sm text-red-500 font-semibold mb-2">이미지를 추가하거나 기본 이미지를 선택해주세요.</div>
              {/* 기본이미지는 이제 ImageUpload 컴포넌트 내 토글 사용 */}
            </div>
          )}

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
              disabled={loading || !title.trim() || !content.trim() || checkinPercent < 100}
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
        {/* 폭 확장: 모바일 padding, 데스크탑 중앙 정렬 + 넓은 컨테이너 */}
        <div className="mx-auto w-full px-3 md:px-6 max-w-6xl">
          <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 min-h-[720px] flex flex-col">
            <AIQuestionWriter 
              onComplete={handleAIQuestionComplete}
              onBack={() => setCurrentView("main")}
            />
          </div>
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

// Next.js App Router: Page-level component using useSearchParams must wrap it in <Suspense>
// to allow the router to handle streaming/dynamic params without a CSR bailout warning.
export default function NewDiaryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <NewDiaryContent />
    </Suspense>
  );
}

"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import ImageUpload from "@/components/diary/ImageUpload";
import EmotionVoice from "@/components/diary/EmotionVoice";
import MusicSetting from "@/components/diary/MusicSetting";
import WritingMode from "@/components/diary/WritingMode";
import DiarySettings from "@/components/diary/DiarySettings";
import AIQuestionWriter from "@/components/diary/AIQuestionWriter";
import FreeWriter from "@/components/diary/FreeWriter";
import Link from "next/link";

// 기본 제공 이미지들 (작성 페이지와 동일)
const defaultImages = [
  "/images/def/default1.jpg",
  "/images/def/default2.jpg",
];

interface DiaryDataResponse {
  id: string;
  title?: string;
  content: string;
  emotion?: string;
  weather?: string;
  isPublic?: boolean;
  contentVisibility?: string;
  question?: string;
  selectedQuestions?: Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }>; // 기존 선택 질문들
  writingDuration?: number;
  mediaUrl?: string;
  mediaType?: string;
  postVisibility?: string; // 프론트 변환용
  diaryDate?: string;
  lat?: number;
  lng?: number;
}

function EditDiaryInner() {
  const { id } = useParams();
  const router = useRouter();

  // View states
  const [currentView, setCurrentView] = useState<"main" | "ai-question" | "free-write" | "settings">("main");

  // Core form states
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 기존 이미지 or 기본이미지
  const [presetKey, setPresetKey] = useState<string | null>(null); // 프리셋 선택 키
  const [showDefaultImageSelect, setShowDefaultImageSelect] = useState(false);
  const [emotion, setEmotion] = useState("😊");
  const [voiceRecord, setVoiceRecord] = useState<Blob | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<any>(null); // TODO: 필요시 타입 활용
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questionId, setQuestionId] = useState(""); // 기존 작성 로직과 동일 구조 유지
  const [questionModel, setQuestionModel] = useState<string | undefined>(undefined);
  const [originalQuestion, setOriginalQuestion] = useState<string | null>(null);
  const [initialQuestions, setInitialQuestions] = useState<
    Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }>
  >([]);
  const [startTime] = useState<number>(Date.now());

  // Date (기존 일기 날짜 유지 - 수정시 변경 허용 안한다고 가정)
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Diary settings
  const [diarySettings, setDiarySettings] = useState({
    postVisibility: "public" as "private" | "public" | "friends",
    contentVisibility: "public" as "public" | "private",
    weather: "sunny" as "sunny" | "cloudy" | "rainy" | "snowy"
  });

  // Location: 기존 일기에 포함된 좌표는 유지만 하고 UI로 편집하지 않음 (위치 섹션 제거 요구사항)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Misc states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch existing diary
  useEffect(() => {
    const fetchDiary = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/diaries/${id}`);
        const d: DiaryDataResponse = res.data;
        // content는 서버에서 제목을 포함한 통합 포맷일 수도 있어 작성 페이지 포맷과 맞추기 위해 파싱 시도
        // 작성 시 '[제목] xxx' 형태로 저장했으므로 역파싱
        let parsedTitle = d.title || "";
        let parsedContent = d.content || "";
        if (!parsedTitle && d.content?.startsWith('[제목] ')) {
          const splitIdx = d.content.indexOf('\n\n');
          if (splitIdx !== -1) {
            parsedTitle = d.content.substring(5, splitIdx).trim();
            parsedContent = d.content.substring(splitIdx + 2).trim();
          }
        }
        setTitle(parsedTitle);
        setContent(parsedContent);
        setEmotion(d.emotion || "😊");
        setDiarySettings({
          postVisibility: d.isPublic ? 'public' : 'private',
            // friends 모드는 기존 데이터에 없다면 유지 불가 -> 추후 확장 시 서버 필드 확인 필요
          contentVisibility: (d.contentVisibility as any) || 'public',
          weather: (d.weather as any) || 'sunny'
        });
        if (d.mediaUrl && d.mediaType?.includes('image')) {
          // 서버 저장된 mediaUrl이 프리셋 경로(/images/...)인지 검사 후 presetKey 추론
          if (d.mediaUrl.startsWith('/images/')) {
            setPreview(d.mediaUrl);
            const match = d.mediaUrl.match(/\/images\/(?:seasons|weather)\/(.+)\.(?:jpg|png|jpeg|webp)$/);
            if (match) setPresetKey(match[1]);
          } else {
            setPreview(d.mediaUrl.startsWith('http') ? d.mediaUrl : `https://chynggi.cafe24.com/${d.mediaUrl}`);
          }
        }
        if (d.lat && d.lng) {
          setLat(d.lat); setLng(d.lng); // 표시/편집 UI 제거: 단순 보존
        }
        if (d.question) {
          setOriginalQuestion(d.question);
          // questionId는 서버에서 별도 제공한다면 세팅 필요 (현재 응답 구조 미확인) -> 유지
        }
        if (Array.isArray(d.selectedQuestions) && d.selectedQuestions.length > 0) {
          setInitialQuestions(d.selectedQuestions);
        }
        if (d.diaryDate) setSelectedDate(d.diaryDate.substring(0,10));
      } catch (e) {
        setError('일기 정보를 불러오지 못했습니다.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDiary();
  }, [id]);

  // 위치 재요청 로직 제거 (위치 편집 UI 삭제)

  const handleImageSelect = (file: File | null) => {
    setImage(file);
    if (file) { setPreview(URL.createObjectURL(file)); setShowDefaultImageSelect(false); }
  };
  const handleDefaultImageSelect = (url: string) => { setImage(null); setPreview(url); setShowDefaultImageSelect(false); };
  const handleWritingModeSelect = (mode: "question" | "free") => { setCurrentView(mode === 'question' ? 'ai-question' : 'free-write'); };
  const handleAIQuestionComplete = (data: { title: string; content: string; questionId: string; questionModel?: string; selectedQuestions: Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }> }) => {
    setTitle(data.title);
    setContent(data.content);
    setQuestionId(data.questionId);
    setQuestionModel(data.questionModel);
    if (Array.isArray(data.selectedQuestions)) {
      setInitialQuestions(data.selectedQuestions);
    }
    setCurrentView('main');
  };
  const handleFreeWriteComplete = (data: { title: string; content: string }) => { setTitle(data.title); setContent(data.content); setCurrentView('main'); };

  const handleSubmit = async () => {
    if (!id) return;
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 모두 입력해주세요.'); return; }
    setLoading(true); setError('');
    try {
      const writingDuration = Math.floor((Date.now() - startTime) / 1000);
      const formData = new FormData();
      const combinedContent = title ? `[제목] ${title}\n\n${content}` : content;
      formData.append('content', combinedContent);
      formData.append('emotion', emotion);
      if (selectedDate) formData.append('diaryDate', selectedDate);
      formData.append('writingDuration', writingDuration.toString());
      const isPublic = diarySettings.postVisibility !== 'private';
      formData.append('isPublic', isPublic.toString());
      formData.append('contentVisibility', diarySettings.contentVisibility);
      formData.append('weather', diarySettings.weather);
  if (lat != null && lng != null) { formData.append('lat', lat.toString()); formData.append('lng', lng.toString()); }
      if (questionId) formData.append('questionId', questionId);
      if (questionModel) formData.append('questionModel', questionModel);
      if (image) {
        formData.append('file', image);
      } else if (presetKey) {
        formData.append('preset', presetKey);
      } else if (preview && preview.startsWith('/images/')) {
        // preset 추론
        const match = preview.match(/\/images\/(?:seasons|weather)\/(.+)\.(?:jpg|png|jpeg|webp)$/);
        if (match) formData.append('preset', match[1]);
      }
      // 선택 질문 배열 전송(JSON 문자열)
      if (initialQuestions && initialQuestions.length > 0) {
        formData.append('selectedQuestionDomains', JSON.stringify(initialQuestions.map(q => q.domain)));
        formData.append('selectedQuestionTexts', JSON.stringify(initialQuestions.map(q => q.text)));
      }
      // TODO: music, voiceRecord 처리 로직 (작성 페이지에 있는 경우 동일하게 확장 필요)

      const response = await api.put(`/diaries/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.status === 200 || response.status === 201) {
        alert('일기가 수정되었습니다.');
        router.push(`/diary/${id}`);
      } else {
        throw new Error('수정 실패');
      }
    } catch (err: any) {
      console.error('일기 수정 오류:', err?.response?.data || err);
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) setError(`수정 실패: ${serverMsg}`);
      else if (err?.response?.status === 400) setError('요청 형식이 올바르지 않습니다.');
      else setError('일기 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally { setLoading(false); }
  };

  if (initialLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-800">일기 수정</h1>
          </div>

          <ImageUpload 
            onImageSelect={(file) => { setImage(file); if (file) { setPresetKey(null); } }} 
            preview={preview} 
            onDefaultImageSelect={(url, key) => {
              setPreview(url);
              setPresetKey(key || null);
              setImage(null);
              setError("");
            }}
          />

          {/* 위치 저장 섹션 제거됨: 전역 개인정보 설정에서 제어. 기존 일기 좌표만 보존. */}

          <EmotionVoice 
            emotion={emotion}
            onEmotionChange={setEmotion}
            onVoiceRecord={setVoiceRecord}
          />

            <MusicSetting 
              onMusicSelect={setSelectedMusic}
              selectedTrack={selectedMusic}
            />

          <WritingMode onModeSelect={handleWritingModeSelect} />

          {/* 기존 제목/내용 요약 */}
          {(title || content) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">현재 내용</h3>
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
                onClick={() => { setCurrentView((initialQuestions && initialQuestions.length > 0) ? 'ai-question' : (questionId || originalQuestion ? 'ai-question' : 'free-write')); }}
                className="text-xs text-blue-600 underline mt-2"
              >
                수정하기
              </button>
            </div>
          )}

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

          <div className="flex gap-2">
            <Link 
              href={`/diary/${id}`} 
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg text-center hover:bg-gray-500"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "수정 중..." : "수정 저장"}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-red-500 text-sm text-center">{error}</div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'ai-question') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="mx-auto w-full px-3 md:px-6 max-w-6xl">
          <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 min-h-[720px] flex flex-col">
            <AIQuestionWriter 
              onComplete={handleAIQuestionComplete}
              onBack={() => setCurrentView('main')}
              // 기존 질문 표시만 (컴포넌트가 prop 지원한다면 확장)
              initialQuestions={initialQuestions}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'free-write') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <FreeWriter 
            onComplete={handleFreeWriteComplete}
            onBack={() => setCurrentView('main')}
            initialTitle={title}
            initialContent={content}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">일기 설정</h1>
            <button
              onClick={() => setCurrentView('main')}
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
              onClick={() => setCurrentView('main')}
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg text-center hover:bg-gray-500"
            >
              취소
            </button>
            <button
              onClick={() => setCurrentView('main')}
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

export default function EditDiaryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EditDiaryInner />
    </Suspense>
  );
}

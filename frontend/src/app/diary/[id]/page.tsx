"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  emotion: string;
  weather: string;
  postVisibility: string;
  contentVisibility: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  voice?: string;
  music?: {
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  };
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  isOwner: boolean;
  question?: string;
  writingDuration?: number;
  emotionScore?: number;
  isPublic?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  reactions?: any[];
}

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        const response = await api.get(`/diaries/${params.id}`);
        const diaryData = response.data;
        
        // Transform legacy data to new format
        const transformedDiary: DiaryEntry = {
          id: diaryData.id,
          title: diaryData.title || "무제",
          content: diaryData.content,
          emotion: diaryData.emotion || "😊",
          weather: diaryData.weather || "sunny",
          postVisibility: diaryData.isPublic ? "public" : "private",
          contentVisibility: diaryData.contentVisibility || "public",
          createdAt: diaryData.createdAt,
          updatedAt: diaryData.updatedAt,
          image: diaryData.mediaUrl && diaryData.mediaType?.includes("image") ? diaryData.mediaUrl : undefined,
          voice: diaryData.mediaUrl && diaryData.mediaType?.includes("audio") ? diaryData.mediaUrl : undefined,
          user: {
            id: diaryData.userId || "user",
            nickname: diaryData.user?.nickname || "사용자",
            profileImage: diaryData.user?.profileImage
          },
          isOwner: true, // TODO: 실제 소유자 확인 로직
          question: diaryData.question,
          writingDuration: diaryData.writingDuration,
          emotionScore: diaryData.emotionScore,
          reactions: diaryData.reactions || []
        };
        
        setDiary(transformedDiary);
        setEditContent(transformedDiary.content);
      } catch (err) {
        setError("일기를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDiary();
    }
  }, [params.id]);

  const playVoice = () => {
    if (!diary?.voice) return;

    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(diary.voice);
    audio.play();
    setCurrentAudio(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setCurrentAudio(null);
      setIsPlaying(false);
    };
  };

  const handleUpdate = async () => {
    if (!diary) return;
    
    try {
      await api.put(`/diaries/${diary.id}`, { content: editContent });
      setDiary({ ...diary, content: editContent });
      setEditMode(false);
    } catch {
      setError("수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!diary) return;
    
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await api.delete(`/diaries/${diary.id}`);
      router.push("/diary");
    } catch {
      setError("삭제에 실패했습니다.");
    }
  };

  const getWeatherEmoji = (weather: string) => {
    switch (weather) {
      case "sunny": return "☀️";
      case "cloudy": return "☁️";
      case "rainy": return "🌧️";
      case "snowy": return "❄️";
      default: return "☀️";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/diary" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            일기 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!diary) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 py-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/diary" className="text-blue-600 hover:text-blue-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="text-sm text-gray-500">{formatDate(diary.createdAt)}</div>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
              {diary.user.profileImage ? (
                <Image src={diary.user.profileImage} alt="프로필" width={48} height={48} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-800">{diary.user.nickname}</div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">{diary.emotion}</span>
                <span className="mr-2">{getWeatherEmoji(diary.weather)}</span>
                {diary.isOwner && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    내 일기
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Question (if exists) */}
          {diary.question && (
            <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-semibold mb-1">오늘의 질문</div>
              <div className="text-sm text-blue-800">{diary.question}</div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-800 mb-4">{diary.title}</h1>

          {/* Image */}
          {diary.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <Image 
                src={diary.image} 
                alt="일기 사진" 
                width={400} 
                height={300} 
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Voice Message */}
          {diary.voice && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">음성 메시지</span>
                <button
                  onClick={playVoice}
                  className={`p-2 rounded-full ${
                    isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="m9.5 16.5 7-4.5-7-4.5v9z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Music */}
          {diary.music && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded mr-3 overflow-hidden">
                  {diary.music.album.images[0] ? (
                    <Image 
                      src={diary.music.album.images[0].url} 
                      alt="앨범 커버" 
                      width={48} 
                      height={48} 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🎵
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{diary.music.name}</div>
                  <div className="text-xs text-gray-600">
                    {diary.music.artists.map(artist => artist.name).join(", ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-4">
            {editMode ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
                  placeholder="일기 내용을 수정해주세요..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {diary.contentVisibility === "private" && !diary.isOwner ? (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-gray-500 mb-2">🔒</div>
                    <p className="text-gray-600 text-sm">이 일기의 내용은 비공개입니다.</p>
                    <div className="mt-2 text-xs text-gray-400">
                      {"*".repeat(Math.min(diary.content.length, 100))}
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{diary.content}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visibility Info */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span>
                  {diary.postVisibility === "private" && "🔒 비공개"}
                  {diary.postVisibility === "public" && "🌍 전체공개"}
                  {diary.postVisibility === "friends" && "👥 친구공개"}
                </span>
                {diary.postVisibility !== "private" && (
                  <>
                    <span>•</span>
                    <span>
                      {diary.contentVisibility === "public" ? "📖 내용공개" : "🔏 내용비공개"}
                    </span>
                  </>
                )}
              </div>
              <div>
                {new Date(diary.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Actions (if owner and not in edit mode) */}
          {diary.isOwner && !editMode && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                수정하기
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              >
                삭제하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

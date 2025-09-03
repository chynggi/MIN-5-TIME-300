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
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  // Like state
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/profile');
        setCurrentUser({ id: response.data.id });
      } catch (err) {
        console.error('현재 사용자 정보 조회 실패:', err);
      }
    };
    fetchCurrentUser();
  }, []);

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
            id: diaryData.userId || diaryData.user?.id || "user",
            nickname: diaryData.user?.username || diaryData.user?.nickname || "사용자",
            profileImage: diaryData.user?.profileImage
          },
          isOwner: currentUser ? currentUser.id === (diaryData.userId || diaryData.user?.id) : false,
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

    if (params.id && currentUser) {
      fetchDiary();
      // 별도 like 상태 요청
      (async () => {
        try {
          const res = await api.get(`/diaries/${params.id}/like`);
          setLiked(res.data.liked);
          setLikeCount(res.data.likeCount);
        } catch (e) { /* ignore */ }
      })();
    }
  }, [params.id, currentUser]);

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

  const toggleLike = async () => {
    if (!diary) return;
    if (likeLoading) return;
    setLikeLoading(true);
    // Optimistic
    setLiked(prev => !prev);
    setLikeCount(c => (liked ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await api.post(`/diaries/${diary.id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (e) {
      // rollback
      setLiked(prev => !prev);
      setLikeCount(c => (liked ? c + 1 : Math.max(0, c - 1)));
    } finally {
      setLikeLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative inline-flex mb-6">
            <div className="w-14 h-14 rounded-full border-4 border-t-transparent border-indigo-400 animate-spin" />
            <div className="absolute inset-0 w-14 h-14 rounded-full blur-sm opacity-40 bg-gradient-to-tr from-indigo-400 to-rose-300 animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium tracking-tight">일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-8 text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <Link href="/diary" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            일기 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!diary) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation / Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/diary" className="group inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow transition">
            <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hover:text-slate-700 transition">일기</span>
            <span>/</span>
            <span className="text-slate-700">상세</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md">{formatDate(diary.createdAt)}</span>
            {diary.isOwner && (
              <span className="text-[11px] font-semibold tracking-wide uppercase bg-rose-100 text-rose-600 px-2 py-1 rounded-md">내 일기</span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main Article */}
            <article className="lg:col-span-2 space-y-6">
              {/* Title & Media Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/50 overflow-hidden">
                {diary.image && (
                  <div className="relative group">
                    <Image src={diary.image} alt="일기 이미지" width={1200} height={600} className="w-full h-72 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>
                )}
                <div className="p-8">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-4 leading-snug">
                    {diary.title}
                  </h1>
                  {diary.voice && (
                    <div className="mb-6">
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <button
                          onClick={playVoice}
                          className={`relative inline-flex items-center justify-center w-12 h-12 rounded-full text-white shadow ${isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-500 hover:bg-indigo-600'} transition`}
                        >
                          {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                          ) : (
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="m9.5 17.5 8-5.5-8-5.5v11z"/></svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-500 mb-1">음성 메시지</div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r from-indigo-400 to-rose-400 animate-pulse ${!isPlaying && 'w-0'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {diary.music && (
                    <div className="mb-6">
                      <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-rose-50 border border-slate-200 rounded-xl p-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200">
                          {diary.music.album.images[0] ? (
                            <Image src={diary.music.album.images[0].url} alt="앨범 커버" width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">🎵</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-700 truncate">{diary.music.name}</div>
                          <div className="text-xs text-slate-500 truncate">{diary.music.artists.map(a => a.name).join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    {editMode ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-4 py-4 text-sm leading-relaxed rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200 min-h-[240px] font-medium shadow-inner resize-none"
                          placeholder="일기 내용을 수정해주세요..."
                        />
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => setEditMode(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition">취소</button>
                          <button onClick={handleUpdate} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition">저장</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {diary.contentVisibility === 'private' && !diary.isOwner ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">🔒</div>
                            <p className="text-slate-600 text-sm font-medium">이 일기의 내용은 비공개입니다.</p>
                            <div className="mt-4 text-[11px] tracking-wider text-slate-400 font-mono">
                              {'*'.repeat(Math.min(diary.content.length, 120))}
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-slate prose-sm max-w-none">
                            <p className="text-slate-700 leading-7 whitespace-pre-wrap font-medium tracking-wide">{diary.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer meta inside card */}
                <div className="px-8 pb-6">
                  <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-100">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase ${diary.postVisibility === 'private' ? 'bg-slate-200 text-slate-700' : diary.postVisibility === 'friends' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {diary.postVisibility === 'private' && '비공개'}
                      {diary.postVisibility === 'friends' && '친구공개'}
                      {diary.postVisibility === 'public' && '전체공개'}
                    </span>
                    {diary.postVisibility !== 'private' && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase ${diary.contentVisibility === 'public' ? 'bg-rose-100 text-rose-600' : 'bg-slate-300 text-slate-700'}`}>
                        {diary.contentVisibility === 'public' ? '내용공개' : '내용비공개'}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-slate-400 font-medium">
                      {new Date(diary.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              {diary.isOwner && !editMode && (
                <div className="flex flex-wrap gap-3 items-center">
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold shadow hover:shadow-md hover:bg-slate-800 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 0v14m9-7H4" /></svg>
                    수정하기
                  </button>
                  <button onClick={handleDelete} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold shadow hover:from-rose-600 hover:to-rose-700 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M10 11v6m4-6v6M9 7l1-2h4l1 2m-7 0h8l-1 12H10L9 7z" /></svg>
                    삭제하기
                  </button>
                  <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold shadow transition border ${liked ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' : 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50'}`}
                  >
                    {liked ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6c-1.5-1.5-3.9-1.5-5.4 0L12 8l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0-1.5 1.5-1.5 3.9 0 5.4L12 21l8.8-11c1.5-1.5 1.5-3.9 0-5.4Z" /></svg>
                    )}
                    <span className="font-medium">{likeCount}</span>
                  </button>
                </div>
              )}
              {!diary.isOwner && !editMode && (
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold shadow transition border ${liked ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' : 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50'}`}
                  >
                    {liked ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6c-1.5-1.5-3.9-1.5-5.4 0L12 8l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0-1.5 1.5-1.5 3.9 0 5.4L12 21l8.8-11c1.5-1.5 1.5-3.9 0-5.4Z" /></svg>
                    )}
                    <span className="font-medium">{likeCount}</span>
                  </button>
                </div>
              )}
            </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Author Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/50 p-6">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-200 to-rose-200 flex items-center justify-center">
                  {diary.user.profileImage ? (
                    <Image src={diary.user.profileImage} alt="프로필" width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold tracking-tight text-slate-800 truncate">{diary.user.nickname}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <span>{diary.emotion}</span>
                    <span>{getWeatherEmoji(diary.weather)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-semibold tracking-wide text-slate-500 mb-1">작성</div>
                  <div className="text-xs font-bold text-slate-700">{new Date(diary.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-semibold tracking-wide text-slate-500 mb-1">수정</div>
                  <div className="text-xs font-bold text-slate-700">{new Date(diary.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-semibold tracking-wide text-slate-500 mb-1">길이</div>
                  <div className="text-xs font-bold text-slate-700">{diary.content.length}</div>
                </div>
              </div>
            </div>

            {/* Question */}
            {diary.question && (
              <div className="bg-gradient-to-br from-indigo-600 to-rose-500 rounded-2xl shadow-md p-6 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 mb-2">오늘의 질문</div>
                <div className="text-sm font-medium leading-relaxed">{diary.question}</div>
              </div>
            )}

            {/* Extra Stats (placeholder if more metadata later) */}
            {(diary.writingDuration || diary.emotionScore) && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/50 p-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">작성 정보</div>
                <div className="space-y-3">
                  {diary.writingDuration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">작성 시간</span>
                      <span className="font-semibold text-slate-800">{Math.round(diary.writingDuration / 60)}분</span>
                    </div>
                  )}
                  {diary.emotionScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">감정 점수</span>
                      <span className="font-semibold text-slate-800">{diary.emotionScore}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { diaryApi } from "@/services/diary-api";

interface DiaryPreview { 
  id: string; 
  content: string; 
  createdAt: string; 
  question: string; 
  emotion?: string; 
  emotionScore?: number; // 감정 점수 fallback
  likes?: number; 
  username?: string; 
  liked?: boolean; // 현재 사용자 좋아요 여부
  mediaUrl?: string;
  mediaType?: string; // 'image' | 'audio' | 'spotify' 등
}
interface FriendTodayDiary { diaryId: string; userId: string; username: string; profileImageUrl?: string; emotion?: string | null; createdAt: string; }
interface CalendarDay { date: number; emotion?: string; hasEntry: boolean; isLocked?: boolean; diaryId?: string; emotionScore?: number; }

export default function DashboardPage() {
  const [diaries, setDiaries] = useState<DiaryPreview[]>([]);
  // Top 10 인기 일기 (배너형)
  const [popularDiaries, setPopularDiaries] = useState<DiaryPreview[]>([]);
  const [friendsTodayDiaries, setFriendsTodayDiaries] = useState<FriendTodayDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  // 자동 가로 스크롤 관련
  const [showScrollHint, setShowScrollHint] = useState(true); // 초기 힌트 (스크롤바 제거 후 첫 이동 시 사라짐)
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  // 전역 보라색 채팅 아이콘 제거: ChatList import/state 삭제
  const router = useRouter();

  // 감정 이모지 매핑
  const emotionEmojis: { [key: string]: string } = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    excited: "🤩",
    calm: "😌",
    tired: "😴",
    stressed: "😰",
    grateful: "🙏"
  };

  // 감정 fallback 계산
  const computeEmotionFromScore = (score?: number) => {
    if (score == null) return '';
    if (score >= 8) return '😊';
    if (score >= 6) return '🤩';
    if (score >= 4) return '😌';
    if (score >= 2) return '😢';
    return '😠';
  };

  // 캘린더 데이터 생성 (실제 DB 연동)
  const generateCalendarData = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    const calendar: CalendarDay[] = [];
    
    // 빈 칸 추가 (이전 달 마지막 날들)
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendar.push({ date: 0, emotion: "", hasEntry: false });
    }
    
    // 해당 월의 일기 데이터 조회
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    let diaries: any[] = [];
    try {
      const res = await diaryApi.getDiaries({ 
        limit: 100,
        startDate,
        endDate
      });
      diaries = res.diaries || [];
    } catch (error) {
      console.error('일기 조회 실패:', error);
    }
    
    // 날짜별 일기 맵 생성
    const diaryMap = new Map();
    diaries.forEach(diary => {
      const diaryDate = new Date(diary.diaryDate); // diaryDate 사용
      const dayKey = diaryDate.getDate();
      if (diaryDate.getFullYear() === year && diaryDate.getMonth() === month) {
        diaryMap.set(dayKey, diary);
      }
    });
    
    // 현재 달의 날짜들 추가
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDateObj = new Date(year, month, date);
      const todayObj = new Date(todayYear, todayMonth, todayDate);
      
      let emotion = "";
      let hasEntry = false;
      let isLocked = false;
      let diaryId = "";
      let emotionScore = 0;
      
      // 해당 날짜에 일기가 있는지 확인
      const diaryForDate = diaryMap.get(date);
      if (diaryForDate) {
        hasEntry = true;
        diaryId = diaryForDate.id;
        emotionScore = diaryForDate.emotionScore || 0;
        
        // 실제 저장된 이모지 사용, 없으면 emotionScore 기반으로 폴백
        if (diaryForDate.emotion) {
          emotion = diaryForDate.emotion; // 실제 저장된 이모지 사용
        } else {
          // emotionScore를 기반으로 감정 결정 (폴백)
          if (emotionScore >= 8) emotion = "😊"; // happy
          else if (emotionScore >= 6) emotion = "🤩"; // excited  
          else if (emotionScore >= 4) emotion = "😌"; // calm
          else if (emotionScore >= 2) emotion = "😢"; // sad
          else emotion = "😠"; // angry
        }
      }
      
      // 미래 날짜는 잠금 처리
      if (currentDateObj > todayObj) {
        isLocked = true;
      }
      
      calendar.push({
        date,
        emotion,
        hasEntry,
        isLocked,
        diaryId,
        emotionScore
      });
    }
    
    setCalendarData(calendar);
  };

  useEffect(() => {
    generateCalendarData();
  }, [currentDate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/diaries").then(res => res.data.diaries.slice(0, 3)).catch(() => []),
      diaryApi.getFriendsTodayDiaries().then(res => res.items).catch(() => []),
      api.get("/diaries?sort=popularity&limit=10").then(res => res.data.diaries || []).catch(() => []),
    ])
      .then(async ([d, friendsToday, popularList]) => {
        setDiaries(d);
        setFriendsTodayDiaries(friendsToday);
        // 각 인기 일기에 대해 좋아요 상태 병렬 조회 (가능 하면)
        try {
          const withLikeStates = await Promise.all(popularList.map(async (pd: any) => {
            try {
              const likeRes = await api.get(`/diaries/${pd.id}/like`);
              return { ...pd, liked: likeRes.data.liked, likes: likeRes.data.likeCount };
            } catch {
              return pd;
            }
          }));
          setPopularDiaries(withLikeStates);
        } catch {
          setPopularDiaries(popularList);
        }
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 좋아요 토글 (Optimistic)
  const togglePopularLike = async (id: string) => {
    setPopularDiaries(prev => prev.map(d => d.id === id ? { ...d, liked: !d.liked, likes: (d.likes || 0) + (d.liked ? -1 : 1) } : d));
    try {
      const res = await api.post(`/diaries/${id}/like`);
      setPopularDiaries(prev => prev.map(d => d.id === id ? { ...d, liked: res.data.liked, likes: res.data.likeCount } : d));
    } catch {
      // 실패 시 롤백
      setPopularDiaries(prev => prev.map(d => d.id === id ? { ...d, liked: !d.liked, likes: (d.likes || 0) + (d.liked ? 1 : -1) } : d));
    }
  };

  // 스크롤 힌트 감지
  const handleBannerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollLeft > 16) setShowScrollHint(false);
  };

  // 자동 스크롤 (부드럽게 순환)
  useEffect(() => {
    if (!bannerRef.current) return;
    let raf: number;
    const speed = 0.4; // px per frame 정도 (약 24px/s @60fps)
    const step = () => {
      if (!autoScrollPaused && bannerRef.current) {
        const el = bannerRef.current;
        el.scrollLeft += speed;
        // 끝 근처 도달 시 처음으로 자연스럽게 이동 (무한 루프 효과)
        if (el.scrollWidth - el.clientWidth - el.scrollLeft < 1) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [bannerRef, autoScrollPaused, popularDiaries.length]);

  return (
    <div className="flex flex-col space-y-6">
      {/* 전역 채팅 아이콘 및 ChatList 모달 제거됨 */}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 space-y-6">
        {/* 오늘의 일기 (맞팔 친구들 오늘 공개 일기) - 없으면 안내 문구 */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">오늘의 일기</h2>
            <Link href="/friends" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {friendsTodayDiaries.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">오늘의 일기가 없습니다.</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {friendsTodayDiaries.map(friend => (
                <div key={friend.diaryId} className="flex-shrink-0 text-center cursor-pointer group" 
                     onClick={() => { window.location.href = `/diary/${friend.diaryId}`; }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg border-4 border-pink-400 relative bg-gray-100 overflow-hidden">
                    {friend.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={friend.profileImageUrl} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" title="오늘 새 일기"></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-700 font-medium truncate w-16" title={friend.username}>{friend.username}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 캘린더 섹션 */}
        <section className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
              ◀
            </button>
            <h2 className="font-bold text-lg">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
              ▶
            </button>
          </div>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-sm font-bold p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* 캘린더 날짜들 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => {
              if (day.date === 0) {
                return <div key={index} className="aspect-square"></div>;
              }

              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const currentDateObj = new Date(year, month, day.date);
              const today = new Date();
              const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              const isPast = currentDateObj < todayObj;
              const isToday = currentDateObj.getTime() === todayObj.getTime();
              const isFuture = currentDateObj > todayObj;
              
              return (
                <div key={index} className="aspect-square relative">
                  <button
                    className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                      isToday 
                        ? 'bg-blue-100 border-2 border-blue-400 cursor-pointer hover:bg-blue-200'
                        : day.hasEntry 
                          ? 'bg-white shadow-sm cursor-pointer hover:bg-gray-50' 
                          : day.isLocked
                            ? 'bg-gray-200 cursor-not-allowed opacity-70'
                            : 'bg-yellow-100 cursor-pointer hover:bg-yellow-200'
                    }`}
                    onClick={() => {
                      if (day.isLocked) {
                        // 미래 날짜는 클릭 불가
                        return;
                      }
                      
                      if (day.hasEntry && day.diaryId) {
                        // 작성된 일기가 있으면 해당 일기 상세 페이지로 이동
                        window.location.href = `/diary/${day.diaryId}`;
                      } else {
                        // 일기가 없으면 새 일기 작성 페이지로 이동 (날짜 전달)
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day.date).padStart(2,'0')}`;
                        window.location.href = `/diary/new?date=${dateStr}`;
                      }
                    }}
                    disabled={day.isLocked}
                  >
                    <span className={`font-medium ${isToday ? 'text-blue-600 font-bold' : day.isLocked ? 'text-gray-400' : ''}`}>
                      {day.date}
                    </span>
                    
                    {/* 이모티콘 또는 자물쇠 아이콘 표시 */}
                    {day.emotion && day.hasEntry ? (
                      <span className="text-lg leading-none">
                        {day.emotion}
                      </span>
                    ) : day.isLocked ? (
                      <span className="text-sm text-gray-500">🔒</span>
                    ) : null}
                    
                    {isToday && !day.hasEntry && (
                      <span className="text-xs text-blue-600 mt-1">오늘</span>
                    )}
                    {/* 회고 배지: 과거 날짜 + hasEntry + createdAt이 아닌 과거에 저장된 것으로 서버에서 isRetrospective 제공 시 */}
                    {day.hasEntry && (day as any).isRetrospective && (
                      <span className="absolute top-1 right-1 bg-pink-600 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none font-semibold">
                        회고
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top10 인기 일기 배너 (광고식/말풍선 스타일) */}
        <section className="relative bg-gradient-to-r from-pink-200 to-pink-300 rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-gray-800">🔥 인기 일기 Top 10</h2>
            <Link href="/diaries?sort=popularity" className="text-sm text-pink-700 font-medium hover:underline">전체보기</Link>
          </div>
          {popularDiaries.length === 0 && (
            <div className="bg-white/60 rounded-lg p-6 text-center text-sm text-gray-600">아직 인기 일기가 없습니다. 첫 번째 감정 일기를 남겨보세요!</div>
          )}
          {popularDiaries.length > 0 && (
            <div
              ref={bannerRef}
              className="relative flex gap-4 overflow-x-auto no-scrollbar pr-4 py-1"
              onScroll={handleBannerScroll}
              onMouseEnter={() => setAutoScrollPaused(true)}
              onMouseLeave={() => setAutoScrollPaused(false)}
              onTouchStart={() => setAutoScrollPaused(true)}
              onTouchEnd={() => setAutoScrollPaused(false)}
              style={{ scrollBehavior: 'auto', maxHeight: 190 }}
            >
              {/* Gradient Scroll Hint */}
              {showScrollHint && <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-pink-200 to-transparent hidden sm:block" />}
              {popularDiaries.map((d, idx) => {
                const created = new Date(d.createdAt);
                const timeStr = created.toLocaleTimeString('ko-KR', { hour12: false });
                const displayEmotion = d.emotion || computeEmotionFromScore(d.emotionScore);
                return (
                  <div key={d.id} className="flex-shrink-0 w-56 group">
                    <button
                      onClick={() => window.location.href = `/diary/${d.id}`}
                      className="relative w-full text-left"
                    >
                      {/* 말풍선 본체 */}
                      <div className="rounded-2xl bg-emerald-200 px-4 pt-3 pb-4 shadow hover:shadow-md transition-all h-[170px] flex flex-col justify-between group/bubble" title={d.content}>
                        <div className="flex items-start gap-2">
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-inner text-sm">{(d.username || '익명').slice(0,1)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-medium">
                              <span>{timeStr}</span>
                              <span className="flex items-center gap-1 text-gray-600">
                                {/* 이미지 (mediaType === image 또는 파일 확장자) */}
                                {(d.mediaType === 'image' || /\.(png|jpe?g|gif|webp)$/i.test(d.mediaUrl || '')) && (
                                  <span title="첨부 이미지">📷</span>
                                )}
                                {/* 음성 (mediaType === audio) */}
                                {(d.mediaType === 'audio' || /\.(mp3|m4a|wav|ogg)$/i.test(d.mediaUrl || '')) && (
                                  <span title="음성 메시지">🔊</span>
                                )}
                                {/* Spotify 링크 (content 내 spotify 혹은 mediaType === 'spotify') */}
                                {((d.mediaType === 'spotify') || /open\.spotify\.com/.test(d.content)) && (
                                  <span title="Spotify 음악">🎧</span>
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-[12px] font-semibold text-gray-800 line-clamp-2">{d.question}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-700 line-clamp-2 flex-1" title={d.content}>{d.content}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                          <span className="flex items-center gap-1">
                            {displayEmotion && <span className="text-base leading-none">{emotionEmojis[displayEmotion] || displayEmotion}</span>}
                            <span>{d.username || '익명'}</span>
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePopularLike(d.id); }}
                            className={`flex items-center gap-1 font-medium transition text-[11px] ${d.liked ? 'text-rose-600' : 'text-pink-600 hover:text-rose-500'}`}
                            title={d.liked ? '좋아요 취소' : '좋아요'}
                          >
                            {d.liked ? '💖' : '❤️'} {d.likes ?? 0}
                          </button>
                        </div>
                        <span className="absolute -top-2 -left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{idx + 1}</span>
                      </div>
                      {/* 꼬리 */}
                      <div className="absolute -bottom-2 left-6 w-5 h-5 rotate-45 bg-emerald-200"></div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* 모바일 드래그 힌트 */}
          {showScrollHint && popularDiaries.length > 0 && (
            <div className="sm:hidden mt-2 text-center text-[11px] text-pink-700 animate-pulse">옆으로 드래그해서 더 보기 →</div>
          )}
        </section>
      </div>
    </div>
  );
}

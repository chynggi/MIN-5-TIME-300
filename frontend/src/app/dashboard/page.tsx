"use client";
import Link from "next/link";
import AdviceBar from "@/components/advice/AdviceBar";
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
  const [autoScrollPaused, setAutoScrollPaused] = useState(false); // (이제 사용X: 로테이션으로 대체 예정)
  const [currentPopularIndex, setCurrentPopularIndex] = useState(0); // 로테이션 현재 인덱스
  const [previousPopularIndex, setPreviousPopularIndex] = useState<number | null>(null); // 애니메이션 이전 인덱스
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward'); // 좌우 슬라이드 방향
  const rotationInterval = 5500; // ms 간격
  const ANIM_DURATION = 600; // 애니메이션 길이(ms)
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
        // 인기 일기는 간단히 그대로 세팅 (좋아요/내용 제거된 미니 카드 전용)
        setPopularDiaries(popularList);
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 좋아요/콘텐츠 UI 제거 -> 관련 토글 로직 삭제

  // 로테이션 (광고 배너처럼 한 개씩 순환)
  const changePopularIndex = (next: number) => {
    if (!popularDiaries.length) return;
    if (next === currentPopularIndex) return;
    const direction: 'forward' | 'backward' =
      (next > currentPopularIndex || (currentPopularIndex === popularDiaries.length - 1 && next === 0))
        ? 'forward'
        : 'backward';
    setSlideDirection(direction);
    setPreviousPopularIndex(currentPopularIndex);
    setCurrentPopularIndex(next);
    setIsAnimating(true);
    setTimeout(() => {
      setPreviousPopularIndex(null);
      setIsAnimating(false);
    }, ANIM_DURATION);
  };

  useEffect(() => {
    if (!popularDiaries.length) return;
    const id = setInterval(() => {
      changePopularIndex((currentPopularIndex + 1) % popularDiaries.length);
    }, rotationInterval);
    return () => clearInterval(id);
  }, [popularDiaries.length, currentPopularIndex]);

  return (
  <div className="flex flex-col space-y-6 py-6">
      {/* 전역 채팅 아이콘 및 ChatList 모달 제거됨 */}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 space-y-6">
  {/* 오늘의 일기 (맞팔 친구들 오늘 공개 일기) - 없으면 안내 문구 */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">오늘의 일기</h2>
            {/* '더보기' 링크 제거 요청에 따라 삭제 */}
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

        {/* 오늘의 한마디 바: 오늘의 일기와 캘린더 사이에, 같은 너비로 분리 배치 */}
        <section>
          <AdviceBar variant="inline" title="오늘의 한마디" fullWidth />
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

        {/* Top10 인기 일기 - 단일 로테이션 (프로필 + 말풍선 + 아이콘 + 닉네임/작성일) */}    
        <section className="relative bg-gradient-to-r from-pink-200 to-pink-300 rounded-xl shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg text-gray-800">🔥 인기 일기 Top 10</h2>
            <Link href="/diaries?sort=popularity" className="text-sm text-pink-700 font-medium hover:underline">전체보기</Link>
          </div>
          {popularDiaries.length === 0 && (
            <div className="bg-white/60 rounded-lg p-4 text-center text-sm text-gray-600">아직 인기 일기가 없습니다. 첫 번째 감정 일기를 남겨보세요!</div>
          )}
          {popularDiaries.length > 0 && (() => {
            const active = popularDiaries[currentPopularIndex];
            const prev = previousPopularIndex !== null ? popularDiaries[previousPopularIndex] : null;

            const buildCard = (d: DiaryPreview | null, isPrev = false) => {
              if (!d) return null;
              const created = new Date(d.createdAt);
              const timeStr = created.toLocaleTimeString('ko-KR', { hour12: false });
              const hasImage = (d.mediaType === 'image' || /\.(png|jpe?g|gif|webp)$/i.test(d.mediaUrl || ''));
              const hasAudio = (d.mediaType === 'audio' || /\.(mp3|m4a|wav|ogg)$/i.test(d.mediaUrl || ''));
              const hasSpotify = (d.mediaType === 'spotify' || /open\.spotify\.com/.test(d.content));
              const inClass = slideDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft';
              const outClass = slideDirection === 'forward' ? 'animate-slideOutLeft' : 'animate-slideOutRight';
              return (
                <div
                  key={d.id + (isPrev ? '-prev' : '-curr')}
                  className={`absolute inset-0 flex items-start gap-3 ${isPrev ? outClass + ' pointer-events-none' : inClass}`}
                  style={{willChange:'transform,opacity'}}
                >
                     {/* 순위 배지 */}
                   <span className="absolute top-0 left-0 bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow z-10">{(isPrev ? previousPopularIndex : currentPopularIndex)! + 1}</span>
                  <button
                    onClick={() => window.location.href = `/diary/${d.id}`}
                    className="relative w-14 h-14 rounded-2xl border-2 border-cyan-300 bg-white flex items-center justify-center text-base font-semibold shadow overflow-hidden shrink-0 hover:shadow-lg transition"
                    title={d.username || '익명'}
                  >
                 
                    
                    {(d as any).profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(d as any).profileImageUrl} alt={d.username || '익명'} className="w-full h-full object-cover" />
                    ) : (
                      (d.username || '익명').slice(0,1)
                    )}
                  </button>
                  <button
                    onClick={() => window.location.href = `/diary/${d.id}`}
                    className="relative flex-1 text-left"
                  >
                    <div className="relative bg-cyan-400 text-black rounded-3xl px-5 py-2.5 flex items-center gap-4 shadow hover:shadow-xl transition h-14">
                      <span className="font-semibold text-base tracking-wide tabular-nums">{timeStr}</span>
                      <div className="flex items-center gap-3 ml-auto text-base select-none">
                        <span title={hasImage ? '이미지 첨부 있음' : '이미지 없음'} className={hasImage ? 'text-black drop-shadow-sm' : 'text-black/30'}>📷</span>
                        <span title={hasAudio ? '음성 메시지 있음' : '음성 메시지 없음'} className={hasAudio ? 'text-black drop-shadow-sm' : 'text-black/30'}>🔊</span>
                        <span title={hasSpotify ? 'Spotify 음악 있음' : 'Spotify 음악 없음'} className={hasSpotify ? 'text-black drop-shadow-sm' : 'text-black/30'}>🎧</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            };

            return (
              <div className="relative group">
                <div className="relative min-h-[68px] overflow-hidden">
                  {buildCard(prev, true)}
                  {buildCard(active)}
                </div>
                <div className="mt-2 flex justify-center gap-2 relative">
                  {popularDiaries.slice(0,10).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => changePopularIndex(i)}
                      aria-label={`순위 ${i+1}번 보기`}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentPopularIndex ? 'bg-pink-600 scale-110' : 'bg-white/60 hover:bg-white/90'}`}
                    />
                  ))}
                </div>
                <style jsx>{`
                  @keyframes slideInRight {0%{opacity:0;transform:translateX(110%);}55%{opacity:1;}100%{opacity:1;transform:translateX(0);} }
                  @keyframes slideOutLeft {0%{opacity:1;transform:translateX(0);}100%{opacity:0;transform:translateX(-110%);} }
                  @keyframes slideInLeft {0%{opacity:0;transform:translateX(-110%);}55%{opacity:1;}100%{opacity:1;transform:translateX(0);} }
                  @keyframes slideOutRight {0%{opacity:1;transform:translateX(0);}100%{opacity:0;transform:translateX(110%);} }
                  .animate-slideInRight{animation:slideInRight ${ANIM_DURATION}ms cubic-bezier(.45,.05,.2,.95) forwards;}
                  .animate-slideOutLeft{animation:slideOutLeft ${ANIM_DURATION}ms cubic-bezier(.45,.05,.2,.95) forwards;}
                  .animate-slideInLeft{animation:slideInLeft ${ANIM_DURATION}ms cubic-bezier(.45,.05,.2,.95) forwards;}
                  .animate-slideOutRight{animation:slideOutRight ${ANIM_DURATION}ms cubic-bezier(.45,.05,.2,.95) forwards;}
                `}</style>
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
}

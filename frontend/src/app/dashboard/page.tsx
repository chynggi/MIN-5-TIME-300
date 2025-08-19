"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { diaryApi } from "@/services/diary-api";

interface DiaryPreview { id: string; content: string; createdAt: string; question: string; emotion?: string; likes?: number; username?: string; }
interface FriendPreview { id: string; username: string; avatar?: string; isOnline?: boolean; hasTodayDiary?: boolean; }
interface CalendarDay { date: number; emotion?: string; hasEntry: boolean; isLocked?: boolean; diaryId?: string; emotionScore?: number; }

export default function DashboardPage() {
  const [diaries, setDiaries] = useState<DiaryPreview[]>([]);
  const [popularDiary, setPopularDiary] = useState<DiaryPreview | null>(null);
  const [friends, setFriends] = useState<FriendPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
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
      const diaryDate = new Date(diary.createdAt);
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
        
        // emotionScore를 기반으로 감정 결정
        if (emotionScore >= 8) emotion = "happy";
        else if (emotionScore >= 6) emotion = "excited";
        else if (emotionScore >= 4) emotion = "calm";
        else if (emotionScore >= 2) emotion = "sad";
        else emotion = "angry";
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
      api.get("/friends").then(res => res.data.friends.slice(0, 5)).catch(() => []),
      // 가장 최근에 작성된 일기 중 인기 있는 일기 가져오기
      api.get("/diaries?sort=popularity&limit=1").then(res => res.data.diaries[0] || null).catch(() => null),
    ])
      .then(([d, f, popular]) => {
        setDiaries(d);
        setFriends(f);
        setPopularDiary(popular);
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-pink-50">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-4 space-y-6">
        {/* 친구들 일기 스토리 섹션 */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">오늘의 일기</h2>
            <Link href="/friends" className="text-blue-600 text-sm">더보기</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {friends.length === 0 ? (
              // 기본 친구 아바타들 (당일 일기를 작성한 친구들)
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg border-4 ${
                    i === 0 ? 'border-pink-400 bg-green-200' : 
                    i === 1 ? 'border-orange-400 bg-orange-200' : 
                    'border-blue-400 bg-blue-200'
                  } relative`}>
                    👤
                    {/* 새 일기 알림 점 */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-700 font-medium">
                    {i === 0 ? '민수' : i === 1 ? '지영' : '현우'}
                  </p>
                </div>
              ))
            ) : (
              friends.filter(friend => friend.hasTodayDiary).map((friend, i) => (
                <div key={friend.id} className="flex-shrink-0 text-center cursor-pointer" 
                     onClick={() => {
                       // 친구의 오늘 일기 보기
                       console.log(`View ${friend.username}'s today diary`);
                     }}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg border-4 border-pink-400 relative ${
                    friend.isOnline ? 'bg-green-200' : 'bg-gray-200'
                  }`}>
                    {friend.avatar || '👤'}
                    {/* 새 일기 알림 점 */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-700 font-medium">{friend.username}</p>
                </div>
              ))
            )}
          </div>
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
                <div key={index} className="aspect-square">
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
                        // 일기가 없으면 새 일기 작성 페이지로 이동
                        window.location.href = '/diary/new';
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
                        {emotionEmojis[day.emotion] || '😊'}
                      </span>
                    ) : day.isLocked ? (
                      <span className="text-sm text-gray-500">🔒</span>
                    ) : null}
                    
                    {isToday && !day.hasEntry && (
                      <span className="text-xs text-blue-600 mt-1">오늘</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 가장 인기 있는 일기 배너 */}
        <section className="bg-gradient-to-r from-pink-200 to-pink-300 rounded-xl shadow p-4">
          <h2 className="font-bold text-lg mb-3 text-gray-800">🔥 가장 인기 있는 일기</h2>
          {popularDiary && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">{popularDiary.username || '익명'}</span>
                    <p className="text-xs text-gray-500">
                      {new Date(popularDiary.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 음성 메시지 아이콘 */}
                  <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    🎤
                  </button>
                  <span className="text-sm text-gray-600">❤️ {popularDiary.likes || 12}</span>
                </div>
              </div>
              
              <div className="mb-2">
                <h3 className="font-semibold text-gray-800 mb-1">{popularDiary.question}</h3>
                <p className="text-gray-700 text-sm line-clamp-2">{popularDiary.content}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {popularDiary.emotion && (
                    <span className="text-lg">{emotionEmojis[popularDiary.emotion] || '😊'}</span>
                  )}
                  <span className="text-xs text-gray-500">감정 일기</span>
                </div>
                <button 
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  onClick={() => window.location.href = `/diary/${popularDiary.id}`}
                >
                  자세히 보기
                </button>
              </div>
            </div>
          )}
          
          {!popularDiary && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">지영</span>
                    <p className="text-xs text-gray-500">2일 전</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 음성 메시지 아이콘 */}
                  <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    🎤
                  </button>
                  <span className="text-sm text-gray-600">❤️ 15</span>
                </div>
              </div>
              
              <div className="mb-2">
                <h3 className="font-semibold text-gray-800 mb-1">오늘 가장 감사했던 일은?</h3>
                <p className="text-gray-700 text-sm line-clamp-2">
                  친구들과 함께한 점심시간이 정말 즐거웠어요. 함께 웃고 이야기하며 스트레스가 모두 날아갔습니다...
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🙏</span>
                  <span className="text-xs text-gray-500">감정 일기</span>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  자세히 보기
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

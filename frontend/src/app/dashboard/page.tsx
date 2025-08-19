"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

interface DiaryPreview { id: string; content: string; createdAt: string; question: string; emotion?: string; likes?: number; username?: string; }
interface FriendPrevi        </div>
      </div>
    </div>
  );
}sername: string; avatar?: string; isOnline?: boolean; hasTodayDiary?: boolean; }
interface CalendarDay { date: number; emotion?: string; hasEntry: boolean; }

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

  // 캘린더 데이터 생성
  const generateCalendarData = () => {
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
    
    // 현재 달의 날짜들 추가
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDateObj = new Date(year, month, date);
      const todayObj = new Date(todayYear, todayMonth, todayDate);
      
      let emotion = "";
      let hasEntry = false;
      
      // 과거 날짜들 - 일부만 감정 데이터가 있다고 가정 (실제 일기가 작성된 날짜만)
      if (currentDateObj < todayObj) {
        // 과거 날짜 중 일부만 일기를 작성했다고 가정 (20% 확률로 줄임)
        if (Math.random() > 0.8) {
          const emotions = ["happy", "sad", "excited", "calm", "tired"];
          emotion = emotions[Math.floor(Math.random() * emotions.length)];
          hasEntry = true;
        }
      } 
      // 오늘 날짜 - 활성화 (일기 작성 가능)
      else if (currentDateObj.getTime() === todayObj.getTime()) {
        hasEntry = false; // 기본적으로 미작성 상태
      }
      // 미래 날짜들 - 이제 일기 작성 가능 (잠금 해제)
      else {
        hasEntry = false; // 미래 날짜도 일기 작성 가능
      }
      
      calendar.push({
        date,
        emotion,
        hasEntry
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
                          : isFuture
                            ? 'bg-yellow-100 cursor-pointer hover:bg-yellow-200'
                            : 'bg-yellow-100 cursor-pointer hover:bg-yellow-200'
                    }`}
                    onClick={() => {
                      if (isToday || isFuture) {
                        // 오늘 또는 미래 날짜 클릭 시 일기 작성 페이지로 이동
                        window.location.href = '/diary/new';
                      } else if (isPast && day.hasEntry) {
                        // 과거 작성된 일기 클릭 시 해당 일기 보기
                        console.log(`View diary for ${day.date}`);
                      } else if (isPast && !day.hasEntry) {
                        // 과거 미작성 날짜도 일기 작성 가능
                        window.location.href = '/diary/new';
                      }
                    }}
                  >
                    <span className={`font-medium ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                      {day.date}
                    </span>
                    {day.emotion && day.hasEntry && (
                      <span className="text-lg leading-none">
                        {emotionEmojis[day.emotion] || '😊'}
                      </span>
                    )}
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
          {popularDiary ? (
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
          ) : (
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

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-2 z-10 md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:rounded-t-xl md:shadow">
        <Link href="/dashboard" className="flex flex-col items-center text-blue-600 font-bold">
          <span className="text-lg">📦</span>
          <span className="text-xs">Diary</span>
        </Link>
  <Link href="/community2" className="flex flex-col items-center">
          <span className="text-lg">💬</span>
          <span className="text-xs">Community</span>
        </Link>
        <Link href="/friends" className="flex flex-col items-center">
          <span className="text-lg">�</span>
          <span className="text-xs">Friends</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center">
          <span className="text-lg">👤</span>
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

interface DiaryPreview { id: string; content: string; createdAt: string; question: string; emotion?: string; }
interface CommunityPreview { id: string; content: string; createdAt: string; user: { username: string }; question: string; }
interface ChatRoomPreview { id: string; name: string; createdAt: string; }
interface FriendPreview { id: string; username: string; avatar?: string; isOnline?: boolean; }
interface CalendarDay { date: number; emotion?: string; hasEntry: boolean; }

export default function DashboardPage() {
  const [diaries, setDiaries] = useState<DiaryPreview[]>([]);
  const [communities, setCommunities] = useState<CommunityPreview[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomPreview[]>([]);
  const [friends, setFriends] = useState<FriendPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
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
      
      // 오늘 이전 날짜들 - 일부만 감정 데이터가 있다고 가정
      if (currentDateObj < todayObj) {
        // 과거 날짜 중 일부만 일기를 작성했다고 가정 (30% 확률)
        if (Math.random() > 0.7) {
          const emotions = ["happy", "sad", "excited", "calm", "tired"];
          emotion = emotions[Math.floor(Math.random() * emotions.length)];
          hasEntry = true;
        }
      } 
      // 오늘 날짜 - 활성화
      else if (currentDateObj.getTime() === todayObj.getTime()) {
        // 오늘은 아직 작성하지 않았거나 작성했을 수 있음
        hasEntry = false; // 기본적으로 미작성 상태
      }
      // 미래 날짜들 - 자물쇠 표시
      else {
        emotion = "🔒"; // 자물쇠 이모지
        hasEntry = false;
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

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/diaries").then(res => res.data.diaries.slice(0, 3)).catch(() => []),
      api.get("/communities/diaries").then(res => res.data.diaries.slice(0, 3)).catch(() => []),
      api.get("/chat/rooms").then(res => res.data.rooms.slice(0, 3)).catch(() => []),
      api.get("/friends").then(res => res.data.friends.slice(0, 5)).catch(() => []),
    ])
      .then(([d, c, r, f]) => {
        setDiaries(d);
        setCommunities(c);
        setChatRooms(r);
        setFriends(f);
      })
      .catch(() => setError("대시보드 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs">⏰</span>
          </div>
          <h1 className="text-xl font-bold">5MIN</h1>
        </div>
        <button 
          onClick={() => {
            window.location.href = '/notifications';
          }}
          className="text-yellow-500 text-xl hover:text-yellow-600 transition-colors cursor-pointer"
          aria-label="알림 목록 보기"
          type="button"
        >
          🔔
        </button>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* 친구들 프로필 섹션 */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">친구들</h2>
            <Link href="/friends" className="text-blue-600 text-sm">더보기</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {friends.length === 0 ? (
              // 기본 친구 아바타들 (데이터가 없을 때)
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                    i === 0 ? 'bg-green-200' : i === 1 ? 'bg-orange-200' : 
                    i === 2 ? 'bg-blue-200' : i === 3 ? 'bg-gray-200' : 'bg-purple-200'
                  }`}>
                    👤
                  </div>
                  <p className="text-xs mt-1 text-red-500">Unknown</p>
                </div>
              ))
            ) : (
              friends.map((friend, i) => (
                <div key={friend.id} className="flex-shrink-0 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                    friend.isOnline ? 'bg-green-200' : 'bg-gray-200'
                  }`}>
                    {friend.avatar || '👤'}
                  </div>
                  <p className="text-xs mt-1 text-red-500">{friend.username}</p>
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
                      isFuture 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : isToday 
                          ? 'bg-blue-100 border-2 border-blue-400 cursor-pointer hover:bg-blue-200'
                          : day.hasEntry 
                            ? 'bg-white shadow-sm cursor-pointer hover:bg-gray-50' 
                            : 'bg-yellow-100 cursor-default'
                    }`}
                    disabled={isFuture}
                    onClick={() => {
                      if (isToday) {
                        // 오늘 날짜 클릭 시 일기 작성 페이지로 이동
                        window.location.href = '/diary/new';
                      } else if (isPast && day.hasEntry) {
                        // 과거 작성된 일기 클릭 시 해당 일기 보기
                        console.log(`View diary for ${day.date}`);
                      }
                    }}
                  >
                    <span className={`font-medium ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                      {day.date}
                    </span>
                    {day.emotion && (
                      <span className="text-lg leading-none">
                        {day.emotion === "🔒" ? day.emotion : emotionEmojis[day.emotion] || '😊'}
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

        {/* 스터디 타이머 섹션 */}
        <section className="bg-gradient-to-r from-pink-200 to-pink-300 rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                👤
              </div>
              <span className="text-red-500 text-sm">Unknown</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-green-400 px-4 py-2 rounded-lg">
                <span className="font-bold text-white">
                  {String(currentTime.getHours()).padStart(2, '0')}:
                  {String(currentTime.getMinutes()).padStart(2, '0')}:
                  {String(currentTime.getSeconds()).padStart(2, '0')}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  📷
                </button>
                <button className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  🎧
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 기존 섹션들 */}
        <div className="space-y-4">
          {/* 최근 일기 */}
          <section className="bg-white rounded-xl shadow p-4 border">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg">최근 일기</h2>
              <Link href="/diary" className="text-blue-600 text-sm">더보기</Link>
            </div>
            {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
              <ul className="space-y-2">
                {diaries.length === 0 ? <li>작성한 일기가 없습니다.</li> : diaries.map(d => (
                  <li key={d.id} className="border rounded p-2 hover:bg-gray-50">
                    <Link href={`/diary/${d.id}`}>
                      {d.emotion && <span className="mr-2">{emotionEmojis[d.emotion] || '😊'}</span>}
                      {d.question || d.content.slice(0, 20)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        {/* 최근 커뮤니티 */}
        <section className="bg-white rounded-xl shadow p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">최근 커뮤니티</h2>
            <Link href="/community2" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="space-y-2">
              {communities.length === 0 ? <li>추천된 질문이 없습니다.</li> : communities.map(c => (
                <li key={c.id} className="border rounded p-2 hover:bg-gray-50">
                  <Link href={`/community2/${c.id}`}>{c.question || c.content.slice(0, 20)} <span className="text-xs text-gray-400">- {c.user?.username}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        
        {/* 최근 채팅방 */}
        <section className="bg-white rounded-xl shadow p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">최근 채팅방</h2>
            <Link href="/chat" className="text-blue-600 text-sm">더보기</Link>
          </div>
          {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
            <ul className="space-y-2">
              {chatRooms.length === 0 ? <li>참여한 채팅방이 없습니다.</li> : chatRooms.map(r => (
                <li key={r.id} className="border rounded p-2 hover:bg-gray-50">
                  <Link href={`/chat/${r.id}`}>{r.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </div>

      {/* 오늘 일기 작성 버튼 */}
      <Link
        href="/diary/new"
        className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg font-bold z-20"
      >
        오늘 일기 쓰기
      </Link>

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

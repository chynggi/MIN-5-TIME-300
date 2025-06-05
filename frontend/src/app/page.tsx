
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-4xl p-8 md:p-16 bg-white/80 rounded-2xl shadow-2xl mt-24 mb-12">
        <div className="flex flex-col items-center md:items-start gap-6 flex-1">
          <img src="/file.svg" alt="로고" className="w-20 h-20 mb-2" />
          <h1 className="text-3xl md:text-5xl font-bold text-blue-700 mb-2">MIN-5-TIME</h1>
          <p className="text-center md:text-left text-gray-700 text-base md:text-xl mb-4">
            5분의 기록, 나를 바꾸는 시간<br />
            감정 일기, 커뮤니티, 통계, 친구와의 소통까지 한 번에!
          </p>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <a href="/login" className="w-full md:w-auto py-3 px-8 rounded-lg bg-blue-600 text-white font-semibold text-lg text-center shadow hover:bg-blue-700 transition">로그인</a>
            <a href="/signup" className="w-full md:w-auto py-3 px-8 rounded-lg border border-blue-600 text-blue-700 font-semibold text-lg text-center bg-white hover:bg-blue-50 transition">회원가입</a>
          </div>
        </div>
        <div className="hidden md:block flex-1">
          <img src="/main-illustration.svg" alt="메인 일러스트" className="w-full max-w-xs mx-auto" />
        </div>
      </div>
      <footer className="mt-auto mb-4 text-gray-400 text-xs">© 2025 MIN-5-TIME</footer>
    </div>
  );
}

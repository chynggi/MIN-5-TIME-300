
"use client";

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

const SPLASH_MESSAGES = [
  "당신의 소중한 하루를 기록해보세요",
  "나를 더 깊이 알아가는 시간",
  "친구들과 함께 나누는 즐거움",
  "WITH ME와 함께 시작하세요"
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % SPLASH_MESSAGES.length);
        setFade(true);
      }, 500); // 0.5초 동안 페이드 아웃 후 문구 변경
    }, 3500); // 3.5초마다 변경

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 로그인된 사용자는 대시보드로 리다이렉트
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // 로그인된 사용자인 경우 로딩 표시 (리다이렉트 중)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">대시보드로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 풀스크린 반응형 배경 이미지 (모바일/데스크탑 분리) */}
      <picture>
        {/* 데스크탑용 (md 이상) */}
        <source srcSet="/Main-desktop.webp" media="(min-width: 768px)" />
        {/* 모바일 기본 */}
        <img
          src="/Main.webp"
          alt="메인 일러스트"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          fetchPriority="high"
        />
      </picture>

      {/* 어두운/그라데이션 오버레이 (텍스트 대비 향상 대비 여유) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60 pointer-events-none" />

      {/* 콘텐츠 래퍼 (필요시 향후 안내 문구 추가 가능) */}
      <div className="relative z-10 flex flex-col justify-end min-h-screen">
        {/* 하단 버튼 패널 - 모바일 앱 safe area 느낌 */}
        <div className="mt-auto px-4 pb-6 pt-8">
          {/* 스플래시 문구 애니메이션 */}
          <div className="h-20 mb-6 flex items-end justify-start">
            <p
              className={`text-white text-3xl md:text-5xl font-bold tracking-tight drop-shadow-lg transition-opacity duration-500 ease-in-out ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {SPLASH_MESSAGES[messageIndex]}
            </p>
          </div>

          <div className="backdrop-blur-md bg-white/15 border border-white/20 rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-2">
              <a
                href="/login"
                className="py-4 text-center font-semibold text-sm md:text-base text-white bg-blue-600/90 hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 transition"
                aria-label="로그인 페이지로 이동"
              >
                로그인
              </a>
              <a
                href="/signup"
                className="py-4 text-center font-semibold text-sm md:text-base text-white bg-gray-900/80 hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 transition"
                aria-label="회원가입 페이지로 이동"
              >
                회원가입
              </a>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/60 mt-4 tracking-wide">© 2025 WITH ME</p>
        </div>
      </div>
    </div>
  );
}

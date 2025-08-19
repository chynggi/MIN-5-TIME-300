"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';

interface ClientLayoutProps {
  children: ReactNode;
}

// 네비게이션을 표시하지 않을 페이지들 (메인페이지, 로그인, 회원가입)
const noNavPages = ["/", "/login", "/signup"];

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  const showNavigation = !noNavPages.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      {showNavigation && <Navigation />}
      
      {/* 메인 콘텐츠 - 하단 네비게이션을 위한 공간 확보 */}
      <main className={`${showNavigation ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {/* 하단 네비게이션 - 모든 환경과 모든 페이지에서 표시 (로그인/회원가입 제외) */}
      {showNavigation && <BottomNav />}
    </div>
  );
}

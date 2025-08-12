"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

// 네비게이션을 표시하지 않을 페이지들
const noNavPages = ["/login", "/signup"];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  
  const showNavigation = !noNavPages.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      {showNavigation && <Navigation />}
      
      {/* 메인 콘텐츠 */}
      <main className={`${showNavigation ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {/* 하단 네비게이션 - 모든 환경에서 표시 */}
      {showNavigation && <BottomNav />}
    </div>
  );
}

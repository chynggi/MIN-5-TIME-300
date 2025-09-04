"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function Navigation() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          WITH ME
        </Link>
        
        {/* 로그인된 사용자: 추후 알림/설정 아이콘 영역 (로그아웃 버튼 제거됨) */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {/* 예: 알림 버튼이나 설정 페이지 진입 버튼을 여기에 배치 가능 */}
          </div>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

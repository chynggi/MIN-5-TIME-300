"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function Navigation() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          MIN-5-TIME
        </Link>
        
        {/* 로그인된 사용자에게만 로그아웃 버튼 표시 */}
        {user && (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            로그아웃
          </button>
        )}
        
        {/* 로그인되지 않은 경우 빈 div */}
        {!user && <div />}
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

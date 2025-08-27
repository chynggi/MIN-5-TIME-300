"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function Navigation() {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          MIN-5-TIME
        </Link>
        
        {/* 로그인된 사용자에게만 알림 버튼과 로그아웃 버튼 표시 */}
        {user && (
          <div className="flex items-center space-x-3">
            {/* 알림 버튼 */}
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="알림"
            >
              {/* 알림 아이콘 (벨 모양) */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-3-3V9a6 6 0 10-12 0v5l-3 3h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              
              {/* 읽지 않은 알림 배지 */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
        
        {/* 로그인되지 않은 경우 빈 div */}
        {!user && <div />}
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { 
    href: "/dashboard", 
    label: "일기",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    href: "/community", 
    label: "커뮤니티",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    href: "/friends", 
    label: "친구",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v-1a6 6 0 012.5-4.83" />
      </svg>
    )
  },
  { 
    href: "/profile", 
    label: "프로필",
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

export default function BottomNav() {
  const pathname = usePathname();
  const shouldHideNav = pathname
    ? [/^\/diary\/new(?:\/|$)/, /^\/diary\/[^/]+\/edit(?:\/|$)/].some((pattern) => pattern.test(pathname))
    : false;

  if (shouldHideNav) {
    // Avoid showing the nav while composing/editing diaries to reduce accidental navigation.
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="safe-area-bottom">
        <ul className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "text-blue-600 bg-blue-50 transform scale-105" 
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50 active:scale-95"
                  }`}
                >
                  <div className={`mb-1 transition-transform duration-300 ${isActive ? 'animate-pulse' : ''}`}>
                    {item.icon(isActive)}
                  </div>
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isActive ? 'font-bold text-blue-600' : 'text-gray-600'
                  }`}>
                    {item.label}
                  </span>
                  {/* 활성 상태 인디케이터 */}
                  {isActive && (
                    <div className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-ping"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

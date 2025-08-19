"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          MIN-5-TIME
        </Link>
  {/* 로그아웃 버튼은 레이아웃/상단바에서 중복되어 제거함 */}
  <div />
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

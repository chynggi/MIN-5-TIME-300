"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-600">
          MIN-5-TIME
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

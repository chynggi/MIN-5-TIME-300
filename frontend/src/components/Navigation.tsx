"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/diary", label: "일기" },
  { href: "/community", label: "커뮤니티" },
  { href: "/chat", label: "채팅" },
  { href: "/statistics", label: "통계" },
  { href: "/notifications", label: "알림" },
  { href: "/profile", label: "프로필" },
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 flex h-14 items-center gap-4">
        <Link href="/" className="font-bold text-lg text-blue-600 mr-6">MIN-5-TIME</Link>
        <ul className="flex gap-4 flex-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith(item.href) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
// This component renders a navigation bar with links to different sections of the application.

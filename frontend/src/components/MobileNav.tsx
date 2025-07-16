import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/diary", label: "일기" },
  { href: "/community2", label: "커뮤니티" },
  { href: "/chat", label: "채팅" },
  { href: "/statistics", label: "통계" },
  { href: "/notifications", label: "알림" },
  { href: "/profile", label: "프로필" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <ul className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col items-center px-2 py-1 text-xs ${pathname.startsWith(item.href) ? "text-blue-600 font-bold" : "text-gray-600"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

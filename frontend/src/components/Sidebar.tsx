import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/diary", label: "일기" },
  { href: "/community", label: "커뮤니티" },
  { href: "/chat", label: "채팅" },
  { href: "/statistics", label: "통계" },
  { href: "/notifications", label: "알림" },
  { href: "/profile", label: "프로필" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-56 bg-white border-r border-gray-200 min-h-screen p-4">
      <ul className="space-y-2">
        {sidebarItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith(item.href) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

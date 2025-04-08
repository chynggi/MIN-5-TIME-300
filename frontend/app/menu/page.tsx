import Link from "next/link";
import { Users, Book, MessageSquare, HelpCircle } from "lucide-react";
import { MainNavigation } from "@/components/main-navigation";

const menuItems = [
  {
    name: "커뮤니티",
    href: "/community",
    icon: Users,
    color: "bg-yellow-500",
  },
  {
    name: "일기",
    href: "/diary",
    icon: Book,
    color: "bg-pink-500",
  },
  {
    name: "메시지",
    href: "/messages",
    icon: MessageSquare,
    color: "bg-green-500",
  },
  {
    name: "질문하기",
    href: "/questions",
    icon: HelpCircle,
    color: "bg-blue-500",
  },
];

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="font-bold">5MIN</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-6">메뉴</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {menuItems.map((item) => (
            <Link href={item.href} key={item.name}>
              <div className={`p-6 rounded-xl hover:opacity-80 transition-opacity ${item.color}`}>
                <div className="flex flex-col items-center justify-center h-32 text-white">
                  <item.icon className="h-8 w-8 mb-2" />
                  <h3 className="font-medium text-lg">{item.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-around bg-white border-t p-2 lg:hidden">
          {menuItems.map((item) => (
            <Link href={item.href} key={item.name}>
              <div className="flex flex-col items-center text-gray-700">
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      
    </div>
  );
}


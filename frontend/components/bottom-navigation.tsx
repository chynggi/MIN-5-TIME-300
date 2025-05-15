"use client"

import { usePathname, useRouter } from "next/navigation"
import { Book, Map, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: "Daily", path: "/", icon: Book },
    { name: "Community", path: "/community", icon: Map },
    { name: "Friends", path: "/friends", icon: Users },
    { name: "Me", path: "/profile", icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-screen-lg mx-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-pink-500 dark:text-pink-400" : "text-gray-500 dark:text-gray-400",
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-pink-500 dark:text-pink-400" : "")} />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

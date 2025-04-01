"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Book, Users, Home, User, Lightbulb, LogIn, UserPlus, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 임시로 인증 상태를 확인하는 함수 (실제로는 상태 관리 라이브러리나 context를 사용해야 함)
const useAuth = () => {
  return {
    isAuthenticated: false, // 여기서 인증 상태를 관리
    user: null
  }
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  // 데스크탑 프로필 드롭다운
  const DesktopProfile = () => {
    if (isAuthenticated) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button 
              className={`p-2 rounded-full transition-colors ${
                isActive("/profile")
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                  : "bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900 dark:hover:text-indigo-400"
              }`}
            >
              <User className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="w-4 h-4 mr-2" />
              프로필
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className="p-2 rounded-full transition-colors bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900 dark:hover:text-indigo-400">
            <User className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push('/login')}>
            <LogIn className="w-4 h-4 mr-2" />
            로그인
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/register')}>
            <UserPlus className="w-4 h-4 mr-2" />
            회원가입
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 모바일 프로필 링크
  const MobileProfile = () => {
    if (isAuthenticated) {
      return (
        <MobileNavLink
          href="/profile"
          isActive={isActive("/profile")}
          icon={<User className="w-5 h-5" />}
          label="프로필"
        />
      )
    }

    return (
      <MobileNavLink
        href="/login"
        isActive={isActive("/login")}
        icon={<LogIn className="w-5 h-5" />}
        label="로그인"
      />
    )
  }

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-semibold">
              <span className="text-indigo-500">5</span>MIN
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            <NavLink href="/" isActive={isActive("/")} icon={<Home className="w-4 h-4 mr-2" />}>
              Home
            </NavLink>
            <NavLink href="/journals" isActive={isActive("/journals")} icon={<Book className="w-4 h-4 mr-2" />}>
              My Journals
            </NavLink>
            <NavLink href="/questions" isActive={isActive("/questions")} icon={<Lightbulb className="w-4 h-4 mr-2" />}>
              질문 추천
            </NavLink>
            <NavLink href="/community" isActive={isActive("/community")} icon={<Users className="w-4 h-4 mr-2" />}>
              Community
            </NavLink>
          </nav>

          <div className="hidden md:block">
            <DesktopProfile />
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-5 h-16">
          <MobileNavLink href="/" isActive={isActive("/")} icon={<Home className="w-5 h-5" />} label="Home" />
          <MobileNavLink
            href="/journals"
            isActive={isActive("/journals")}
            icon={<Book className="w-5 h-5" />}
            label="일기"
          />
          <MobileNavLink
            href="/questions"
            isActive={isActive("/questions")}
            icon={<Lightbulb className="w-5 h-5" />}
            label="질문"
          />
          <MobileNavLink
            href="/community"
            isActive={isActive("/community")}
            icon={<Users className="w-5 h-5" />}
            label="커뮤니티"
          />
          <MobileProfile />
        </div>
      </div>
    </div>
  )
}

function NavLink({
  href,
  isActive,
  icon,
  children,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  isActive,
  icon,
  label,
}: {
  href: string
  isActive: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center text-xs font-medium ${
        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"
      }`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  )
}


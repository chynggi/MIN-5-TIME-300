"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Book, Users, Home, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
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
            <NavLink href="/community" isActive={isActive("/community")} icon={<Users className="w-4 h-4 mr-2" />}>
              Community
            </NavLink>
          </nav>

          <div className="hidden md:block">
            <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 h-16">
          <MobileNavLink href="/" isActive={isActive("/")} icon={<Home className="w-5 h-5" />} label="Home" />
          <MobileNavLink
            href="/journals"
            isActive={isActive("/journals")}
            icon={<Book className="w-5 h-5" />}
            label="Journals"
          />
          <MobileNavLink
            href="/community"
            isActive={isActive("/community")}
            icon={<Users className="w-5 h-5" />}
            label="Community"
          />
          <MobileNavLink
            href="/profile"
            isActive={isActive("/profile")}
            icon={<User className="w-5 h-5" />}
            label="Profile"
          />
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


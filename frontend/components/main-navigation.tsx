"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "홈",
    icon: Home,
    href: "/",
  },
  {
    label: "메뉴",
    icon: Menu,
    href: "/menu",
  },
  {
    label: "메시지",
    icon: MessageSquare,
    href: "/messages",
  },
  {
    label: "프로필",
    icon: User,
    href: "/profile",
  },
];

export function MainNavigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background border-t z-50",
      "md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0",
      className
    )}>
      <nav className={cn(
        "max-w-5xl mx-auto flex justify-around",
        "md:flex-col md:h-screen md:justify-start md:py-8"
      )}>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 md:p-4 md:my-2",
              "text-muted-foreground hover:text-foreground transition-colors",
              pathname === route.href && "text-foreground"
            )}
          >
            <route.icon className="h-6 w-6" />
            <span className="text-xs mt-1 md:hidden">{route.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}


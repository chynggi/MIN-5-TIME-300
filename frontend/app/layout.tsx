import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import BottomNavigation from "@/components/bottom-navigation"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Diary Social App",
  description: "A diary-based social media app",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <main className="max-w-md md:max-w-screen-lg mx-auto bg-white dark:bg-gray-800 min-h-screen pb-16 relative">
            {children}
            <BottomNavigation />
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

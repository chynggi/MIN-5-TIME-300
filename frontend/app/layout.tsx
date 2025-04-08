import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNavigation } from "@/components/main-navigation";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MIN 5 TIME 300",
  description: "지금 솔직한 마음을 나누세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <AuthProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* PC에서 왼쪽에 네비게이션 바 */}
            <div className="hidden md:block md:w-16 border-r">
              <MainNavigation />
            </div>
            <div className="flex-1">
              <div className="mx-auto w-full px-4 sm:px-6 md:max-w-5xl lg:max-w-6xl">
                {children}
              </div>
            </div>
            {/* 모바일에서 하단에 네비게이션 바 */}
            <div className="md:hidden">
              <MainNavigation />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}


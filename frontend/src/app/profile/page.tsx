// frontend/src/app/profile/page.tsx 생성
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { userAPI } from "@/lib/api"

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [mbti, setMbti] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push("/login")
    } else if (user) {
      setUsername(user.username || "")
      setEmail(user.email || "")
      setMbti(user.mbti || "")
    }
  }, [isAuthenticated, user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    
    try {
      await userAPI.updateProfile({ username, email, mbti })
      setSuccess("프로필이 성공적으로 업데이트되었습니다.")
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err.response?.data?.message || "프로필 업데이트에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">내 프로필</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              사용자명
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="mbti" className="block text-sm font-medium mb-1">
              MBTI (선택사항)
            </label>
            <Input
              id="mbti"
              type="text"
              value={mbti}
              onChange={(e) => setMbti(e.target.value.toUpperCase())}
              placeholder="예: INTJ, ENFP 등"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "업데이트 중..." : "프로필 업데이트"}
          </Button>
        </form>
        
        <hr className="my-6" />
        
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full"
        >
          로그아웃
        </Button>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, MessageSquare, Filter, Search, MoreVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCommunityEntries, useToggleLike } from "@/hooks/useCommunity"
import { useAuth } from "@/hooks/useAuth"
import { Entry } from '@/types/community';

export default function CommunityPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'comments'>('latest')
  const [searchQuery, setSearchQuery] = useState("")
  
  const { data, isLoading } = useCommunityEntries({
    page,
    emotion: selectedEmotions,
    sortBy,
    search: searchQuery,
  })
  
  const toggleLikeMutation = useToggleLike()

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => 
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    )
  }

  const handleReport = async (entryId: number) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // 신고 API 호출
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">커뮤니티 일기</h1>
          {isAuthenticated && (
            <Button onClick={() => router.push('/community/write')}>
              <Plus className="w-4 h-4 mr-2" />
              일기 공유하기
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input 
            placeholder="검색어를 입력하세요" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortBy === 'latest' ? '최신순' : 
                 sortBy === 'popular' ? '인기순' : '댓글순'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSortBy('latest')}>
                최신순
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy('popular')}>
                인기순
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortBy('comments')}>
                댓글순
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                감정 필터
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["😊", "😢", "😡", "😌"].map((emotion) => (
                <DropdownMenuCheckboxItem
                  key={emotion}
                  checked={selectedEmotions.includes(emotion)}
                  onCheckedChange={() => toggleEmotion(emotion)}
                >
                  <span className="mr-2">{emotion}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {data?.entries.map((entry: Entry) => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-2">
                    {entry.userImage ? (
                      <img 
                        src={entry.userImage} 
                        alt={entry.username} 
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="text-xs">{entry.username[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{entry.username}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleReport(entry.id)}>
                      신고하기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {entry.prompt}
              </p>
              <p className="text-slate-700 dark:text-slate-300 my-4">
                {entry.content}
              </p>

              <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => toggleLikeMutation.mutate(entry.id)}
                  className={`flex items-center space-x-1 ${
                    entry.isLiked ? "text-rose-500 dark:text-rose-400" : ""
                  }`}
                  disabled={toggleLikeMutation.isPending}
                >
                  <Heart className="w-4 h-4" />
                  <span>{entry.likes}</span>
                </button>

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{entry.comments}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>댓글</DialogTitle>
                      <DialogDescription>
                        다른 사용자의 이야기에 댓글을 남겨보세요
                      </DialogDescription>
                    </DialogHeader>
                    {/* 댓글 컴포넌트는 별도로 구현 */}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.hasMore && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setPage((p) => p + 1)}
        >
          더 보기
        </Button>
      )}
    </div>
  )
}


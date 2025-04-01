'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Filter, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuestionList } from '@/components/questions/question-list'

// 임시 데이터
const DUMMY_QUESTIONS = [
  {
    id: 1,
    title: "오늘 하루 중 가장 감사했던 순간은 언제인가요?",
    description: "매일 감사한 마음을 떠올리면서 긍정적인 에너지를 채워보아요.",
    category: "감사",
    status: "approved",
    author: {
      name: "김민수",
      avatar: "/placeholder-user.jpg"
    },
    upvotes: 42,
    downvotes: 3,
    comments: 12,
    created_at: "2024-03-28"
  },
  // ... 더 많은 더미 데이터
]

export default function QuestionsPage() {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  return (
    <div className="container mx-auto py-6">
      {/* 필터링 UI */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">질문 추천 커뮤니티</h1>
        <Button>새 질문 제안하기</Button>
      </div>

      {/* 검색 및 필터 컨트롤 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input placeholder="질문 검색..." />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
            <SelectItem value="controversial">토론순</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              필터
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setFilter('all')}>전체</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter('pending')}>대기 중</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilter('approved')}>승인됨</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* QuestionList 컴포넌트로 교체 */}
      <QuestionList filter={filter} sortBy={sortBy} />
    </div>
  )
}
'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'
import { questionService } from '@/services/questionService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  { id: 'gratitude', name: '감사' },
  { id: 'reflection', name: '성찰' },
  { id: 'growth', name: '성장' },
  { id: 'challenge', name: '도전' },
  { id: 'relationship', name: '관계' },
]

export function NewQuestionDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "오류",
        description: "질문을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      await questionService.createQuestion({
        title: formData.title,
        description: formData.description,
        category: formData.category
      })

      toast({
        title: "성공",
        description: "질문이 성공적으로 제안되었습니다.",
      })
      
      setFormData({ title: '', description: '', category: '' })
      setIsOpen(false)
    } catch (error) {
      console.error('질문 제안 중 오류:', error)
      toast({
        title: "오류",
        description: "질문 제안 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>새 질문 제안하기</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새로운 질문 제안하기</DialogTitle>
          <DialogDescription>
            다른 사용자들에게 도움이 될 만한 질문을 제안해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">질문</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 오늘 하루 중 가장 감사했던 순간은 언제인가요?"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">설명</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="이 질문을 제안한 이유나 기대하는 효과를 설명해주세요."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category">카테고리</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "제안 중..." : "제안하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
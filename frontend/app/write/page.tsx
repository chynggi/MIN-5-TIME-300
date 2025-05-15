"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ImageIcon, Music, Mic, Save, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Weather options
const weatherOptions = [
  { icon: "☀️", label: "Sunny" },
  { icon: "☁️", label: "Cloudy" },
  { icon: "🌧️", label: "Rainy" },
  { icon: "❄️", label: "Snowy" },
]

// Mood emoji options
const moodOptions = ["😊", "😄", "🥳", "😍", "😌", "😐", "😔", "😢", "😡", "😴"]

export default function WriteDiaryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const today = new Date()

  const [date, setDate] = useState<Date>(today)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null)
  const [hasImage, setHasImage] = useState(false)
  const [hasMusic, setHasMusic] = useState(false)
  const [hasVoice, setHasVoice] = useState(false)

  // AI-generated prompt
  const aiPrompt = "오늘 가장 의미 있었던 대화는 무엇이었으며, 그 대화에서 무엇을 배웠나요?"

  const handleSave = () => {
    if (!title) {
      toast({
        title: "제목 필요",
        description: "일기 제목을 추가해주세요",
        variant: "destructive",
      })
      return
    }

    if (!selectedMood) {
      toast({
        title: "기분 필요",
        description: "일기의 기분 이모티콘을 선택해주세요",
        variant: "destructive",
      })
      return
    }

    if (!selectedWeather) {
      toast({
        title: "날씨 필요",
        description: "오늘의 날씨를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "일기 저장됨",
      description: "일기가 성공적으로 저장되었습니다",
    })

    router.push("/")
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">일기 작성</h1>
      <div className="mb-4">
        <Input
          placeholder="제목을 입력하세요..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="mb-4">
        <Textarea
          placeholder="내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>
          저장
        </Button>
      </div>
    </div>
  )
}

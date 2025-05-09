"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
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
  const aiPrompt = "What was the most meaningful conversation you had today, and what did you learn from it?"

  const handleSave = () => {
    if (!title) {
      toast({
        title: "Title required",
        description: "Please add a title for your diary entry",
        variant: "destructive",
      })
      return
    }

    if (!selectedMood) {
      toast({
        title: "Mood required",
        description: "Please select a mood emoji for your diary entry",
        variant: "destructive",
      })
      return
    }

    if (!selectedWeather) {
      toast({
        title: "Weather required",
        description: "Please select today's weather for your diary entry",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Diary saved",
      description: "Your diary entry has been saved successfully",
    })

    router.push("/")
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Write Diary</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  disabled={(date) => date > today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Input placeholder="Diary title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">How are you feeling today?</div>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={cn(
                    "text-2xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    selectedMood === mood && "bg-gray-100 dark:bg-gray-700 ring-2 ring-pink-500",
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Today's weather</div>
            <div className="flex gap-2">
              {weatherOptions.map((weather) => (
                <button
                  key={weather.icon}
                  onClick={() => setSelectedWeather(weather.icon)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    selectedWeather === weather.icon && "bg-gray-100 dark:bg-gray-700 ring-2 ring-pink-500",
                  )}
                >
                  <span className="text-2xl">{weather.icon}</span>
                  <span className="text-xs mt-1">{weather.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">AI Prompt</div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm italic">{aiPrompt}</div>
          </div>

          <Textarea
            placeholder="Write your diary entry here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />

          <div className="flex gap-2">
            <Button
              variant={hasImage ? "default" : "outline"}
              size="sm"
              onClick={() => setHasImage(!hasImage)}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo
            </Button>
            <Button
              variant={hasMusic ? "default" : "outline"}
              size="sm"
              onClick={() => setHasMusic(!hasMusic)}
              className="flex-1"
            >
              <Music className="h-4 w-4 mr-2" />
              Music
            </Button>
            <Button
              variant={hasVoice ? "default" : "outline"}
              size="sm"
              onClick={() => setHasVoice(!hasVoice)}
              className="flex-1"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </Button>
          </div>

          {hasImage && (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-md p-4 text-center">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
              <div className="mt-2 text-sm text-gray-500">Click to upload a photo</div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Diary
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

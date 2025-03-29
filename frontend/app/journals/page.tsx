"use client"

import { useState } from "react"
import { Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample data for past journal entries
const sampleEntries = [
  {
    id: 1,
    date: "March 27, 2025",
    prompt: "What made you feel grateful today?",
    content: "I felt grateful for the beautiful weather and the chance to go for a walk in the park.",
    emotion: "😊",
  },
  {
    id: 2,
    date: "March 26, 2025",
    prompt: "What was challenging for you today?",
    content: "I struggled with a difficult work problem but eventually found a solution.",
    emotion: "😌",
  },
  {
    id: 3,
    date: "March 25, 2025",
    prompt: "What would you like to improve tomorrow?",
    content: "I want to be more patient with myself and take breaks when needed.",
    emotion: "😢",
  },
  {
    id: 4,
    date: "March 24, 2025",
    prompt: "What frustrated you today?",
    content: "The traffic on my commute was terrible and made me late for an important meeting.",
    emotion: "😡",
  },
]

export default function JournalsPage() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])

  const filteredEntries =
    selectedEmotions.length > 0
      ? sampleEntries.filter((entry) => selectedEmotions.includes(entry.emotion))
      : sampleEntries

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Journal Entries</h1>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Calendar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes("😊")}
                onCheckedChange={() => toggleEmotion("😊")}
              >
                <span className="mr-2">😊</span> Happy
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes("😢")}
                onCheckedChange={() => toggleEmotion("😢")}
              >
                <span className="mr-2">😢</span> Sad
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes("😡")}
                onCheckedChange={() => toggleEmotion("😡")}
              >
                <span className="mr-2">😡</span> Angry
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes("😌")}
                onCheckedChange={() => toggleEmotion("😌")}
              >
                <span className="mr-2">😌</span> Calm
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{entry.date}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.prompt}</p>
              </div>
              <span className="text-2xl">{entry.emotion}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}


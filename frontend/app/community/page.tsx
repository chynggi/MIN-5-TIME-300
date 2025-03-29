"use client"

import { useState } from "react"
import { Heart, MessageSquare, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample data for community entries
const sampleCommunityEntries = [
  {
    id: 1,
    date: "March 27, 2025",
    prompt: "What made you feel grateful today?",
    content: "I felt grateful for my family and the support they give me every day.",
    emotion: "😊",
    likes: 12,
    comments: 3,
  },
  {
    id: 2,
    date: "March 27, 2025",
    prompt: "What made you feel grateful today?",
    content: "I'm grateful for the small moments of peace I found today amid the chaos.",
    emotion: "😌",
    likes: 8,
    comments: 1,
  },
  {
    id: 3,
    date: "March 26, 2025",
    prompt: "What was challenging for you today?",
    content: "I had a difficult conversation with a friend that I've been avoiding for weeks.",
    emotion: "😢",
    likes: 15,
    comments: 5,
  },
  {
    id: 4,
    date: "March 26, 2025",
    prompt: "What was challenging for you today?",
    content: "My commute was terrible because of unexpected construction. I was an hour late!",
    emotion: "😡",
    likes: 7,
    comments: 2,
  },
]

export default function CommunityPage() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [likedEntries, setLikedEntries] = useState<number[]>([])

  const filteredEntries =
    selectedEmotions.length > 0
      ? sampleCommunityEntries.filter((entry) => selectedEmotions.includes(entry.emotion))
      : sampleCommunityEntries

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  const toggleLike = (id: number) => {
    setLikedEntries((prev) => (prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Community Journals</h1>

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

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-2">
                    <span className="text-xs">A</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Anonymous</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{entry.prompt}</p>
              </div>
              <span className="text-2xl">{entry.emotion}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-4">{entry.content}</p>

            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
              <button
                onClick={() => toggleLike(entry.id)}
                className={`flex items-center space-x-1 ${
                  likedEntries.includes(entry.id) ? "text-rose-500 dark:text-rose-400" : ""
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>{likedEntries.includes(entry.id) ? entry.likes + 1 : entry.likes}</span>
              </button>

              <button className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>{entry.comments}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


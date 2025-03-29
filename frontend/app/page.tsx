"use client"

import { useState } from "react"
import { Timer } from "@/components/timer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [entry, setEntry] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [isShared, setIsShared] = useState(false)

  const dailyPrompt = "What made you feel grateful today?"

  const handleTimerComplete = () => {
    // Auto-submit when timer completes
    if (entry.trim() && !isSubmitted) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion)
  }

  const handleSaveJournal = () => {
    // Save journal entry with emotion and sharing preference
    console.log({
      entry,
      emotion: selectedEmotion,
      isShared,
    })

    // Reset form
    setEntry("")
    setIsSubmitted(false)
    setSelectedEmotion(null)
    setIsShared(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Today's Journal</h1>
        <Timer duration={300} onComplete={handleTimerComplete} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Daily Prompt</h2>
        <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">{dailyPrompt}</p>

        {!isSubmitted ? (
          <>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Start writing your thoughts..."
              className="min-h-[200px] mb-4"
            />
            <Button onClick={handleSubmit} disabled={!entry.trim()} className="w-full">
              Submit
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="whitespace-pre-wrap">{entry}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">How did this make you feel?</h3>
              <div className="flex space-x-4">
                <EmotionButton
                  emotion="😊"
                  label="Happy"
                  isSelected={selectedEmotion === "😊"}
                  onClick={() => handleEmotionSelect("😊")}
                />
                <EmotionButton
                  emotion="😢"
                  label="Sad"
                  isSelected={selectedEmotion === "😢"}
                  onClick={() => handleEmotionSelect("😢")}
                />
                <EmotionButton
                  emotion="😡"
                  label="Angry"
                  isSelected={selectedEmotion === "😡"}
                  onClick={() => handleEmotionSelect("😡")}
                />
                <EmotionButton
                  emotion="😌"
                  label="Calm"
                  isSelected={selectedEmotion === "😌"}
                  onClick={() => handleEmotionSelect("😌")}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="share" checked={isShared} onCheckedChange={setIsShared} />
              <Label htmlFor="share">Share anonymously with the community</Label>
            </div>

            <Button onClick={handleSaveJournal} disabled={!selectedEmotion} className="w-full">
              Save Journal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmotionButton({
  emotion,
  label,
  isSelected,
  onClick,
}: {
  emotion: string
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
        isSelected
          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      }`}
    >
      <span className="text-2xl mb-1">{emotion}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}


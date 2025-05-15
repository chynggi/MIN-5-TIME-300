"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, ImageIcon, Mic, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

// Sample friends data
const friends = [
  {
    id: "1",
    name: "Emma",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "pink",
    online: true,
  },
  {
    id: "2",
    name: "Liam",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "blue",
    online: false,
  },
  {
    id: "3",
    name: "Sophia",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "green",
    online: true,
  },
  {
    id: "4",
    name: "Noah",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "purple",
    online: false,
  },
]

// Sample messages
const sampleMessages: Record<string, { id: number; sender: string; text: string; time: string }[]> = {
  "1": [
    { id: 1, sender: "friend", text: "Hey there! How are you today?", time: "10:30 AM" },
    { id: 2, sender: "user", text: "I'm good! Just finished writing in my diary.", time: "10:32 AM" },
    { id: 3, sender: "friend", text: "That's great! What did you write about?", time: "10:33 AM" },
    { id: 4, sender: "user", text: "Just reflecting on my day. Had a really productive morning!", time: "10:35 AM" },
    { id: 5, sender: "friend", text: "That sounds nice. I should get back to journaling too.", time: "10:36 AM" },
  ],
  "2": [
    { id: 1, sender: "friend", text: "Did you see the new update to the app?", time: "9:15 AM" },
    { id: 2, sender: "user", text: "Not yet! What's new?", time: "9:20 AM" },
    { id: 3, sender: "friend", text: "They added new mood emojis and better AI prompts!", time: "9:22 AM" },
  ],
  "3": [
    { id: 1, sender: "friend", text: "Happy birthday!!! 🎉🎂", time: "Yesterday" },
    { id: 2, sender: "user", text: "Thank you so much! 😊", time: "Yesterday" },
    { id: 3, sender: "friend", text: "Did you do anything special?", time: "Yesterday" },
    { id: 4, sender: "user", text: "Just a small dinner with family. It was perfect!", time: "Yesterday" },
  ],
  "4": [
    { id: 1, sender: "friend", text: "Hey, want to meet up this weekend?", time: "Monday" },
    { id: 2, sender: "user", text: "What did you have in mind?", time: "Monday" },
    {
      id: 3,
      sender: "friend",
      text: "There's a new café I wanted to check out. They have great reviews.",
      time: "Monday",
    },
    { id: 4, sender: "user", text: "Sounds perfect! Saturday afternoon?", time: "Monday" },
    { id: 5, sender: "friend", text: "Works for me! I'll send you the address.", time: "Monday" },
  ],
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const friendId = params.id as keyof typeof sampleMessages

  const friend = friends.find((f) => f.id === friendId)
  const initialMessages = sampleMessages[friendId] || []

  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const newMsg = {
      id: messages.length + 1,
      sender: "user",
      text: newMessage,
      time: "Just now",
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate friend reply after a delay
    setTimeout(() => {
      const replies = [
        "That's interesting!",
        "I see what you mean.",
        "Thanks for sharing that.",
        "I was thinking the same thing!",
        "How are you feeling about that?",
      ]

      const randomReply = replies[Math.floor(Math.random() * replies.length)]

      const replyMsg = {
        id: messages.length + 2,
        sender: "friend",
        text: randomReply,
        time: "Just now",
      }

      setMessages((prev) => [...prev, replyMsg])
    }, 2000)
  }

  if (!friend) {
    return <div className="p-4">Friend not found</div>
  }

  return (
    <div className="flex flex-col h-screen p-4 max-w-screen-lg mx-auto">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center ml-2 flex-1">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
            <AvatarFallback>{friend.name[0]}</AvatarFallback>
          </Avatar>

          <div>
            <div className="font-medium">{friend.name}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <span className={`h-2 w-2 rounded-full mr-1 ${friend.online ? "bg-green-500" : "bg-gray-400"}`}></span>
              {friend.online ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {message.sender === "friend" && (
              <Avatar className="h-8 w-8 mr-2 self-end">
                <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                <AvatarFallback>{friend.name[0]}</AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === "user" ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <p>{message.text}</p>
              <div className={`text-xs mt-1 ${message.sender === "user" ? "text-pink-200" : "text-gray-500"}`}>
                {message.time}
              </div>
            </div>

            {message.sender === "user" && (
              <Avatar className="h-8 w-8 ml-2 self-end">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="You" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mic className="h-5 w-5" />
          </Button>

          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />

          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

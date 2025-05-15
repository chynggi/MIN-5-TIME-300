"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ImageIcon, Music, Mic, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { diaryService } from "@/lib/api/diary"

// Sample friends data
const friends = [
  {
    id: 1,
    name: "Emma",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "pink",
    updatedToday: true,
    lastDiaryDate: new Date(),
    mood: "😊",
    recordScore: 95,
    hasImage: true,
    hasMusic: false,
    hasVoice: false,
    mbti: "ENFJ",
    followers: 245,
    following: 123,
    interests: ["Music", "Travel", "Photography"],
    bio: "Living life one adventure at a time. Music lover and photography enthusiast.",
  },
  {
    id: 2,
    name: "Liam",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "blue",
    updatedToday: false,
    lastDiaryDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
    mood: "😴",
    recordScore: 87,
    hasImage: false,
    hasMusic: true,
    hasVoice: false,
    mbti: "INTJ",
    followers: 178,
    following: 95,
    interests: ["Tech", "Reading", "Gaming"],
    bio: "Tech enthusiast and bookworm. Always learning something new.",
  },
  {
    id: 3,
    name: "Sophia",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "green",
    updatedToday: true,
    lastDiaryDate: new Date(),
    mood: "🥳",
    recordScore: 92,
    hasImage: true,
    hasMusic: true,
    hasVoice: true,
    mbti: "ESFP",
    followers: 312,
    following: 201,
    interests: ["Fashion", "Cooking", "Dance"],
    bio: "Fashion lover and home chef. Dancing through life with a smile.",
  },
  {
    id: 4,
    name: "Noah",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "purple",
    updatedToday: false,
    lastDiaryDate: new Date(Date.now() - 86400000), // 1 day ago
    mood: "🤔",
    recordScore: 78,
    hasImage: false,
    hasMusic: false,
    hasVoice: true,
    mbti: "ISTP",
    followers: 156,
    following: 87,
    interests: ["Sports", "Hiking", "Photography"],
    bio: "Sports enthusiast and nature lover. Finding beauty in the outdoors.",
  },
]

// Sort friends by record score
const sortedFriends = [...friends].sort((a, b) => b.recordScore - a.recordScore)

export default function FriendsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<(typeof friends)[0] | null>(null)
  const [newFriendName, setNewFriendName] = useState("");

  const filteredFriends = searchQuery
    ? sortedFriends.filter(
        (friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.interests.some((interest) => interest.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : sortedFriends

  const handleAddFriend = async () => {
    if (!newFriendName.trim()) {
      alert("친구 이름을 입력하세요.");
      return;
    }

    try {
      // API 호출로 친구 추가
      await diaryService.addFriend({ name: newFriendName });
      alert("친구가 추가되었습니다.");
      setNewFriendName("");
      router.refresh(); // 페이지 새로고침
    } catch (err) {
      console.error("친구 추가 중 오류:", err);
      alert("친구를 추가하는 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteFriend = async (id: number) => {
    if (confirm("정말로 이 친구를 삭제하시겠습니까?")) {
      try {
        // API 호출로 친구 삭제
        await diaryService.deleteFriend(id);
        alert("친구가 삭제되었습니다.");
        router.refresh(); // 페이지 새로고침
      } catch (err) {
        console.error("친구 삭제 중 오류:", err);
        alert("친구를 삭제하는 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      <div className="relative mb-6">
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">친구 추가</h2>
        <div className="flex gap-2">
          <Input
            placeholder="친구 이름을 입력하세요"
            value={newFriendName}
            onChange={(e) => setNewFriendName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddFriend} className="bg-blue-500 text-white">
            추가
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFriends.map((friend) => (
          <Card key={friend.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <button
                  className={cn("rounded-full p-0.5", friend.updatedToday && `bg-${friend.color}-400 animate-pulse`)}
                  onClick={() => setSelectedFriend(friend)}
                >
                  <Avatar>
                    <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                </button>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{friend.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <span>{formatDate(friend.lastDiaryDate)}</span>
                        <span>•</span>
                        <span>{friend.mood}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        Score: {friend.recordScore}
                      </div>
                      <Button
                        onClick={() => handleDeleteFriend(friend.id)}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {friend.hasImage && <ImageIcon className="h-4 w-4 text-gray-500" />}
                    {friend.hasMusic && <Music className="h-4 w-4 text-gray-500" />}
                    {friend.hasVoice && <Mic className="h-4 w-4 text-gray-500" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedFriend} onOpenChange={(open: boolean) => !open && setSelectedFriend(null)}>
        {selectedFriend && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={selectedFriend.avatar || "/placeholder.svg"} alt={selectedFriend.name} />
                  <AvatarFallback className="text-2xl">{selectedFriend.name[0]}</AvatarFallback>
                </Avatar>
                <DialogTitle className="text-xl">{selectedFriend.name}</DialogTitle>
                <div className="text-sm text-gray-500 mt-1">{selectedFriend.mbti}</div>

                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <div className="font-medium">{selectedFriend.followers}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{selectedFriend.following}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{selectedFriend.recordScore}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="profile">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="diary">Latest Diary</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                  <p className="text-sm">{selectedFriend.bio}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriend.interests.map((interest) => (
                      <span key={interest} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="diary">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedFriend.mood}</span>
                    <span className="text-sm text-gray-500">{formatDate(selectedFriend.lastDiaryDate)}</span>
                  </div>

                  <p className="text-sm">
                    {selectedFriend.id === 1
                      ? "Had an amazing day today! Went to a concert with friends and it was absolutely incredible. The energy was electric and the music was perfect. Definitely a night to remember!"
                      : selectedFriend.id === 2
                        ? "Feeling tired today. Work has been hectic this week. Looking forward to the weekend to catch up on sleep and reading."
                        : selectedFriend.id === 3
                          ? "Birthday celebration today! Had the best time with friends and family. So grateful for all the love and surprises. Feeling blessed and happy!"
                          : "Contemplating some big life decisions. Not sure which path to take, but trying to trust the process. Sometimes the uncertainty is the hardest part."}
                  </p>

                  {selectedFriend.hasImage && (
                    <div className="rounded-md overflow-hidden">
                      <img
                        src="/placeholder.svg?height=200&width=400"
                        alt="Diary image"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString()

  if (isToday) {
    return "Today"
  } else if (isYesterday) {
    return "Yesterday"
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

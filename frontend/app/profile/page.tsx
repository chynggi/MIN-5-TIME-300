"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Edit, Moon, Sun, Coffee, Bed } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { getInterests, addInterest, updateInterests, deleteInterest } from "@/lib/api/profile"

// Sample user profile data
const userProfile = {
  name: "Alex Johnson",
  avatar: "/placeholder.svg?height=80&width=80",
  color: "purple",
  mbti: "INFJ",
  birthday: "May 15, 1995",
  height: "175 cm",
  weight: "68 kg",
  job: "UX Designer",
  followers: 342,
  following: 215,
  recordScore: 89,
  lifestyle: {
    morningPerson: false,
    coffeeDrinker: true,
    averageSleep: "7 hours",
  },
  interests: [
    { name: "Music", level: 85 },
    { name: "Photography", level: 70 },
    { name: "Reading", level: 90 },
    { name: "Travel", level: 75 },
    { name: "Cooking", level: 60 },
  ],
  privacy: {
    diary: "friends",
    profile: "public",
  },
}

export default function ProfilePage() {
  const [privacy, setPrivacy] = useState(userProfile.privacy)
  const [notifications, setNotifications] = useState({
    friendRequests: true,
    diaryReminders: true,
    newMessages: true,
    friendDiaries: true,
  })
  const [interests, setInterests] = useState(userProfile.interests)
  const [newInterest, setNewInterest] = useState("")
  const [editInterest, setEditInterest] = useState({ old: "", new: "" })

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const data = await getInterests()
        setInterests(data)
      } catch (err) {
        console.error("관심사 불러오기 오류:", err)
      }
    }

    fetchInterests()
  }, [])

  const handleNotificationChange = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))

    try {
      await apiClient.put(`/notifications/settings`, { [key]: value })
      alert("알림 설정이 업데이트되었습니다.")
    } catch (err) {
      console.error("알림 설정 업데이트 중 오류:", err)
      alert("알림 설정을 업데이트하는 중 오류가 발생했습니다.")
    }
  }

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return
    try {
      const updated = await addInterest(newInterest)
      setInterests(updated)
      setNewInterest("")
    } catch (err) {
      console.error("관심사 추가 오류:", err)
    }
  }

  const handleUpdateInterest = async () => {
    if (!editInterest.old.trim() || !editInterest.new.trim()) return
    try {
      const updated = await updateInterests(editInterest.old, editInterest.new)
      setInterests(updated)
      setEditInterest({ old: "", new: "" })
    } catch (err) {
      console.error("관심사 수정 오류:", err)
    }
  }

  const handleDeleteInterest = async (interest: string) => {
    try {
      const updated = await deleteInterest(interest)
      setInterests(updated)
    } catch (err) {
      console.error("관심사 삭제 오류:", err)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Link href="/profile/edit">
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center mb-6">
        <Avatar className={`h-24 w-24 mb-4 border-4 border-${userProfile.color}-400`}>
          <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
          <AvatarFallback className="text-3xl">{userProfile.name[0]}</AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-bold">{userProfile.name}</h2>
        <div className="text-sm text-gray-500 mb-2">{userProfile.mbti}</div>

        <div className="flex gap-6 mt-2">
          <div className="text-center">
            <div className="font-medium">{userProfile.followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{userProfile.following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{userProfile.recordScore}</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Basic Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Birthday</span>
                  <span className="text-sm">{userProfile.birthday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Height</span>
                  <span className="text-sm">{userProfile.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Weight</span>
                  <span className="text-sm">{userProfile.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Job</span>
                  <span className="text-sm">{userProfile.job}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfile.interests.map((interest) => (
                  <div key={interest.name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">{interest.name}</span>
                      <span className="text-sm text-gray-500">{interest.level}%</span>
                    </div>
                    <Progress value={interest.level} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      {userProfile.lifestyle.morningPerson ? (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Moon className="h-5 w-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {userProfile.lifestyle.morningPerson ? "Morning Person" : "Night Owl"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userProfile.lifestyle.morningPerson ? "You prefer early mornings" : "You come alive at night"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <Coffee className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {userProfile.lifestyle.coffeeDrinker ? "Coffee Lover" : "Tea Drinker"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userProfile.lifestyle.coffeeDrinker
                          ? "You enjoy your daily coffee"
                          : "You prefer tea over coffee"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <Bed className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Sleep Schedule</div>
                      <div className="text-xs text-gray-500">
                        You average {userProfile.lifestyle.averageSleep} of sleep
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Diary Consistency</span>
                  <span className="text-sm font-medium">92%</span>
                </div>
                <Progress value={92} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Interaction Rate</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Quality</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Diary Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={privacy.diary === "private" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, diary: "private" })}
                    >
                      Private
                    </Button>
                    <Button
                      variant={privacy.diary === "friends" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, diary: "friends" })}
                    >
                      Friends
                    </Button>
                    <Button
                      variant={privacy.diary === "public" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, diary: "public" })}
                    >
                      Public
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Profile Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={privacy.profile === "private" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, profile: "private" })}
                    >
                      Private
                    </Button>
                    <Button
                      variant={privacy.profile === "friends" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, profile: "friends" })}
                    >
                      Friends
                    </Button>
                    <Button
                      variant={privacy.profile === "public" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrivacy({ ...privacy, profile: "public" })}
                    >
                      Public
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="friend-requests" className="flex-1">
                    Friend Requests
                  </Label>
                  <Switch
                    id="friend-requests"
                    checked={notifications.friendRequests}
                    onCheckedChange={(value) => handleNotificationChange("friendRequests", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="diary-reminders" className="flex-1">
                    Daily Diary Reminders
                  </Label>
                  <Switch
                    id="diary-reminders"
                    checked={notifications.diaryReminders}
                    onCheckedChange={(value) => handleNotificationChange("diaryReminders", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-messages" className="flex-1">
                    New Messages
                  </Label>
                  <Switch
                    id="new-messages"
                    checked={notifications.newMessages}
                    onCheckedChange={(value) => handleNotificationChange("newMessages", value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="friend-diaries" className="flex-1">
                    Friend Diary Updates
                  </Label>
                  <Switch
                    id="friend-diaries"
                    checked={notifications.friendDiaries}
                    onCheckedChange={(value) => handleNotificationChange("friendDiaries", value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">관심사 관리</h2>

        <div className="mb-4">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="새 관심사 추가"
            className="border p-2 mr-2"
          />
          <button
            onClick={handleAddInterest}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            추가
          </button>
        </div>

        <ul>
          {interests.map((interest, index) => (
            <li key={index} className="flex items-center justify-between mb-2">
              <span>{interest.name}</span>
              <div>
                <input
                  type="text"
                  value={editInterest.old === interest.name ? editInterest.new : ""}
                  onChange={(e) => setEditInterest({ old: interest.name, new: e.target.value })}
                  placeholder="수정할 이름"
                  className="border p-2 mr-2"
                />
                <button
                  onClick={handleUpdateInterest}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteInterest(interest.name)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

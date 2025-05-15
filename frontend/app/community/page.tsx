"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { diaryService } from "@/lib/api/diary"
// Sample community diary entries
const communityEntries = [
	{
		id: 1,
		user: {
			name: "Sarah",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "pink",
			updatedToday: true,
		},
		location: { lat: 40, lng: -74, name: "New York" },
		title: "Central Park Vibes",
		content:
			"Spent the afternoon in Central Park. The weather was perfect for a picnic and people watching. Saw a street performer playing violin - absolutely magical!",
		mood: "😊",
		weather: "☀️",
		date: new Date(),
		position: { top: "30%", left: "40%" },
	},
	{
		id: 2,
		user: {
			name: "Mike",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "blue",
			updatedToday: true,
		},
		location: { lat: 34, lng: -118, name: "Los Angeles" },
		title: "Beach Day",
		content:
			"Hit the beach today. The waves were perfect for surfing. Met some cool people and had a bonfire in the evening. California sunsets never disappoint!",
		mood: "🤩",
		weather: "☀️",
		date: new Date(),
		position: { top: "10%", left: "70%" },
	},
	{
		id: 3,
		user: {
			name: "Emma",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "green",
			updatedToday: true,
		},
		location: { lat: 41.9, lng: -87.6, name: "Chicago" },
		title: "City Exploration",
		content:
			"Explored downtown Chicago today. The architecture is stunning! Had deep dish pizza for lunch - lived up to the hype. Ended the day with a boat tour on the river.",
		mood: "😄",
		weather: "☁️",
		date: new Date(),
		position: { top: "35%", left: "60%" },
	},
	{
		id: 4,
		user: {
			name: "Liam",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "purple",
			updatedToday: true,
		},
		location: { lat: 29.8, lng: -95.4, name: "Houston" },
		title: "Museum Day",
		content:
			"Visited the Museum of Fine Arts today. The new exhibition was thought-provoking. Spent hours just taking it all in. Art always gives me a new perspective.",
		mood: "🤔",
		weather: "🌧️",
		date: new Date(),
		position: { top: "55%", left: "45%" },
	},
]

export default function CommunityPage() {
	const router = useRouter()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedDiary, setSelectedDiary] = useState<(typeof communityEntries)[0] | null>(null)
	const [comments, setComments] = useState<{ [key: number]: string[] }>({})
	const [likes, setLikes] = useState<{ [key: number]: number }>({})

	const handleAddComment = (id: number, comment: string) => {
		setComments((prev) => ({
			...prev,
			[id]: [...(prev[id] || []), comment],
		}))
	}

	const handleLike = (id: number) => {
		setLikes((prev) => ({
			...prev,
			[id]: (prev[id] || 0) + 1,
		}))
	}

	const handleDelete = async (id: number) => {
		if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
			try {
				//API 호출로 게시글 삭제
				await diaryService.deleteDiary(id);
				alert("게시글이 삭제되었습니다.")
				router.refresh() // 페이지 새로고침
			} catch (err) {
				console.error("게시글 삭제 중 오류:", err)
				alert("게시글을 삭제하는 중 오류가 발생했습니다.")
			}
		}
	}

	const filteredEntries = searchQuery
		? communityEntries.filter(
				(entry) =>
					entry.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					entry.title.toLowerCase().includes(searchQuery.toLowerCase()),
		  )
		: communityEntries

	return (
		<div className="p-4 max-w-screen-lg mx-auto">
			<h1 className="text-3xl font-bold mb-6">커뮤니티 일기</h1>
			<div className="flex items-center mb-4">
				<Input
					placeholder="검색어를 입력하세요..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="flex-grow mr-4"
				/>
				<Button className="bg-blue-500 hover:bg-blue-600 text-white">
					<Search className="h-5 w-5" />
				</Button>
			</div>
			<div className="grid grid-cols-2 gap-6">
				{/* Community entries rendering */}
				{communityEntries.map((entry) => (
					<div key={entry.id} className="p-4 border rounded-lg">
						<h2 className="text-xl font-semibold mb-2">{entry.title}</h2>
						<p className="text-gray-700 mb-4">{entry.content}</p>
						<Button
							className="bg-green-500 hover:bg-green-600 text-white"
							onClick={() => handleLike(entry.id)}
						>
							좋아요 ({likes[entry.id] || 0})
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}

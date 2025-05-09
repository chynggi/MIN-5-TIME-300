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
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Community</h1>

			<div className="relative mb-6">
				<Input
					placeholder="Search by location..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
				/>
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
			</div>

			<div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
				{/* Map placeholder */}
				<div className="absolute inset-0 bg-[url('/placeholder.svg?height=500&width=400')] bg-cover bg-center">
					{/* Map pins */}
					{filteredEntries.map((entry) => (
						<button
							key={entry.id}
							className="absolute"
							style={{ top: entry.position.top, left: entry.position.left }}
							onClick={() => setSelectedDiary(entry)}
						>
							<div className={cn("relative", entry.user.updatedToday && `animate-pulse`)}>
								<Avatar className={`border-2 border-${entry.user.color}-400`}>
									<AvatarImage src={entry.user.avatar || "/placeholder.svg"} alt={entry.user.name} />
									<AvatarFallback>{entry.user.name[0]}</AvatarFallback>
								</Avatar>
								<div
									className={`absolute -bottom-1 -right-1 bg-${entry.user.color}-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs`}
								>
									{entry.mood}
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-2">
				{["All", "New York", "Los Angeles", "Chicago", "Houston"].map((location) => (
					<Button
						key={location}
						variant={searchQuery === location || (location === "All" && !searchQuery) ? "default" : "outline"}
						size="sm"
						onClick={() => setSearchQuery(location === "All" ? "" : location)}
						className="flex-shrink-0"
					>
						{location}
					</Button>
				))}
			</div>

			<div className="mt-4">
				{filteredEntries.map((entry) => (
					<div key={entry.id} className="border p-4 mb-4 rounded">
						<h2 className="text-xl font-bold">{entry.title}</h2>
						<p>{entry.content}</p>
						<div className="flex gap-2 mt-2">
							<button
								onClick={() => router.push(`/community/${entry.id}`)}
								className="bg-blue-500 text-white px-4 py-2 rounded"
							>
								보기
							</button>
							<button
								onClick={() => router.push(`/community/${entry.id}/edit`)}
								className="bg-green-500 text-white px-4 py-2 rounded"
							>
								수정
							</button>
							<button
								onClick={() => handleDelete(entry.id)}
								className="bg-red-500 text-white px-4 py-2 rounded"
							>
								삭제
							</button>
						</div>
					</div>
				))}
			</div>

			<Dialog open={!!selectedDiary} onOpenChange={(open) => !open && setSelectedDiary(null)}>
				{selectedDiary && (
					<DialogContent className="max-w-md">
						<DialogHeader>
							<div className="flex items-center gap-3">
								<Avatar className={`border-2 border-${selectedDiary.user.color}-400`}>
									<AvatarImage src={selectedDiary.user.avatar || "/placeholder.svg"} alt={selectedDiary.user.name} />
									<AvatarFallback>{selectedDiary.user.name[0]}</AvatarFallback>
								</Avatar>
								<div>
									<DialogTitle>{selectedDiary.title}</DialogTitle>
									<div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
										<MapPin className="h-3 w-3" />
										<span>{selectedDiary.location.name}</span>
										<span>•</span>
										<span>{selectedDiary.mood}</span>
										<span>•</span>
										<span>{selectedDiary.weather}</span>
									</div>
								</div>
							</div>
						</DialogHeader>
						<div>
							<p>{selectedDiary.content}</p>
							<div className="mt-4">
								<button
									onClick={() => handleLike(selectedDiary.id)}
									className="bg-blue-500 text-white px-4 py-2 rounded"
								>
									좋아요 ({likes[selectedDiary.id] || 0})
								</button>
							</div>
							<div className="mt-4">
								<h3 className="text-lg font-bold">댓글</h3>
								<ul className="list-disc pl-5">
									{(comments[selectedDiary.id] || []).map((comment, index) => (
										<li key={index}>{comment}</li>
									))}
								</ul>
								<div className="mt-2">
									<input
										type="text"
										placeholder="댓글을 입력하세요"
										className="border p-2 w-full"
										onKeyDown={(e) => {
											if (e.key === "Enter" && e.currentTarget.value.trim()) {
												handleAddComment(selectedDiary.id, e.currentTarget.value)
												e.currentTarget.value = ""
											}
										}}
									/>
								</div>
							</div>
						</div>
					</DialogContent>
				)}
			</Dialog>
		</div>
	)
}

"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, Music, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample diary entries
const diaryEntries = [
	{
		id: 1,
		user: {
			name: "Jane",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "pink",
			updatedToday: true,
		},
		title: "Today was amazing!",
		content:
			"I went hiking with friends and saw the most beautiful sunset. The trail was challenging but worth every step. We had a picnic at the summit and took lots of photos.",
		mood: "😊",
		weather: "☀️",
		date: new Date(),
		hasImage: true,
		hasMusic: false,
		hasVoice: false,
	},
	{
		id: 2,
		user: {
			name: "Alex",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "blue",
			updatedToday: false,
		},
		title: "Rainy day thoughts",
		content:
			"Stayed in and read my favorite book again. The rain against the window created the perfect atmosphere. Made myself a cup of hot chocolate and just enjoyed the quiet moment.",
		mood: "😌",
		weather: "🌧️",
		date: new Date(Date.now() - 86400000), // yesterday
		hasImage: false,
		hasMusic: true,
		hasVoice: false,
	},
	{
		id: 3,
		user: {
			name: "You",
			avatar: "/placeholder.svg?height=40&width=40",
			color: "purple",
			updatedToday: true,
		},
		title: "Mixed feelings",
		content:
			"Work was stressful today, but I managed to finish that big project. Treated myself to ice cream afterward. Sometimes small rewards make all the difference. Looking forward to the weekend.",
		mood: "😐",
		weather: "☁️",
		date: new Date(),
		hasImage: true,
		hasMusic: true,
		hasVoice: true,
	},
]

export default function DiaryFeed() {
	const [selectedDiary, setSelectedDiary] = useState<(typeof diaryEntries)[0] | null>(null)

	return (
		<div className="p-4 max-w-md md:max-w-screen-lg mx-auto">
			<div className="space-y-4">
				{diaryEntries.map((diary) => (
					<Card
						key={diary.id}
						className="cursor-pointer hover:shadow-md transition-shadow"
						onClick={() => setSelectedDiary(diary)}
					>
						<CardHeader className="pb-2">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"rounded-full p-0.5",
										diary.user.updatedToday && `bg-${diary.user.color}-400 animate-pulse`,
									)}
								>
									<Avatar>
										<AvatarImage src={diary.user.avatar || "/placeholder.svg"} alt={diary.user.name} />
										<AvatarFallback>{diary.user.name[0]}</AvatarFallback>
									</Avatar>
								</div>
								<div>
									<div className="font-medium">{diary.title}</div>
									<div className="text-sm text-gray-500 flex items-center gap-1">
										<span>{diary.mood}</span>
										<span>•</span>
										<span>{diary.weather}</span>
										<span>•</span>
										<span>{formatDate(diary.date)}</span>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="pb-2">
							<p className="text-sm line-clamp-2">{diary.content}</p>
						</CardContent>
						<CardFooter>
							<div className="flex gap-2">
								{diary.hasImage && <ImageIcon className="h-4 w-4 text-gray-500" />}
								{diary.hasMusic && <Music className="h-4 w-4 text-gray-500" />}
								{diary.hasVoice && <Mic className="h-4 w-4 text-gray-500" />}
							</div>
						</CardFooter>
					</Card>
				))}

				<Dialog open={!!selectedDiary} onOpenChange={(open: boolean) => !open && setSelectedDiary(null)}>
					{selectedDiary && (
						<DialogContent className="max-w-md">
							<DialogHeader>
								<div className="flex items-center gap-3">
									<div
										className={cn(
											"rounded-full p-0.5",
											selectedDiary.user.updatedToday && `bg-${selectedDiary.user.color}-400 animate-pulse`,
										)}
									>
										<Avatar>
											<AvatarImage src={selectedDiary.user.avatar || "/placeholder.svg"} alt={selectedDiary.user.name} />
											<AvatarFallback>{selectedDiary.user.name[0]}</AvatarFallback>
										</Avatar>
									</div>
									<div>
										<DialogTitle>{selectedDiary.title}</DialogTitle>
										<div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
											<span>{selectedDiary.mood}</span>
											<span>•</span>
											<span>{selectedDiary.weather}</span>
											<span>•</span>
											<span>{formatDate(selectedDiary.date)}</span>
										</div>
									</div>
								</div>
							</DialogHeader>
							<div className="space-y-4">
								<p>{selectedDiary.content}</p>

								{selectedDiary.hasImage && (
									<div className="rounded-md overflow-hidden">
										<img
											src="/placeholder.svg?height=200&width=400"
											alt="Diary image"
											className="w-full h-48 object-cover"
										/>
									</div>
								)}

								{selectedDiary.hasMusic && (
									<div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
										<Music className="h-5 w-5 text-pink-500" />
										<span className="text-sm">Music attached</span>
									</div>
								)}

								{selectedDiary.hasVoice && (
									<div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
										<Mic className="h-5 w-5 text-pink-500" />
										<span className="text-sm">Voice memo attached</span>
									</div>
								)}
							</div>
						</DialogContent>
					)}
				</Dialog>
			</div>
		</div>
	)
}

function formatDate(date: Date): string {
	const now = new Date()
	const isToday = date.toDateString() === now.toDateString()

	if (isToday) {
		return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
	}

	return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

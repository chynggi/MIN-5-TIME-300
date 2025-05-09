import DiaryFeed from "@/components/diary-feed"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function DailyPage() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Diary</h1>
        <Link href="/write">
          <Button size="sm" className="rounded-full bg-pink-500 hover:bg-pink-600">
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <DiaryFeed />
    </div>
  )
}

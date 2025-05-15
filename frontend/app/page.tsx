import DiaryFeed from "@/components/diary-feed"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function DailyPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">나의 일기</h1>
        <Link href="/write">
          <Button size="lg" className="rounded-full bg-pink-500 hover:bg-pink-600">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
      <DiaryFeed />
    </div>
  )
}

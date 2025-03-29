"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { diaryAPI } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DiaryEntry {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  is_shared: boolean;
}

export default function JournalsPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        const response = await diaryAPI.getUserEntries();
        setEntries(response.data);
      } catch (err: any) {
        console.error("Failed to fetch entries:", err);
        setError(err.response?.data?.message || "일기 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchEntries();
    }
  }, [isAuthenticated]);

  const filteredEntries =
    selectedEmotions.length > 0
      ? entries.filter((entry) => selectedEmotions.includes(entry.rating))
      : entries;

  const toggleEmotion = (emotion: number) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]));
  };

  const getEmotionIcon = (rating: number) => {
    switch (rating) {
      case 5: return "😊";
      case 4: return "😌";
      case 3: return "😐";
      case 2: return "😢";
      case 1: return "😡";
      default: return "😐";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="max-w-2xl mx-auto p-4">일기 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">내 일기 목록</h1>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>달력</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                <span>필터</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes(5)}
                onCheckedChange={() => toggleEmotion(5)}
              >
                <span className="mr-2">😊</span> 행복
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes(4)}
                onCheckedChange={() => toggleEmotion(4)}
              >
                <span className="mr-2">😌</span> 평온
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes(3)}
                onCheckedChange={() => toggleEmotion(3)}
              >
                <span className="mr-2">😐</span> 보통
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes(2)}
                onCheckedChange={() => toggleEmotion(2)}
              >
                <span className="mr-2">😢</span> 슬픔
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedEmotions.includes(1)}
                onCheckedChange={() => toggleEmotion(1)}
              >
                <span className="mr-2">😡</span> 화남
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">아직 작성된 일기가 없습니다.</p>
          <Button 
            onClick={() => router.push('/')}
            className="mt-4"
          >
            일기 작성하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{formatDate(entry.created_at)}</h3>
                </div>
                <span className="text-2xl">{getEmotionIcon(entry.rating)}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


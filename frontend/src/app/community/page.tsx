"use client"

import { useState, useEffect } from "react"
import { Heart, MessageSquare, Filter } from "lucide-react"
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

interface SharedEntry {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  username: string;
  profile_image?: string;
  likes: number;
  comment_count: number;
  is_liked: boolean;
}

export default function CommunityPage() {
  const [entries, setEntries] = useState<SharedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [likedEntries, setLikedEntries] = useState<number[]>([]);
  
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const fetchSharedEntries = async () => {
      try {
        setIsLoading(true);
        const response = await diaryAPI.getSharedEntries();
        if (response.data.entries) {
          setEntries(response.data.entries);
          // 좋아요 상태 설정
          const liked = response.data.entries
            .filter((entry: SharedEntry) => entry.is_liked)
            .map((entry: SharedEntry) => entry.id);
          setLikedEntries(liked);
        }
      } catch (err: any) {
        console.error("Failed to fetch shared entries:", err);
        setError(err.response?.data?.message || "공유된 일기를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSharedEntries();
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

  const toggleLike = async (id: number) => {
    try {
      const response = await fetch(`/api/entries/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 엔트리 업데이트
        setEntries(prev => prev.map(entry => 
          entry.id === id 
            ? { ...entry, likes: data.likes, is_liked: data.isLiked } 
            : entry
        ));
        
        // 좋아요 상태 업데이트
        setLikedEntries(prev => 
          data.isLiked 
            ? [...prev, id]  
            : prev.filter(entryId => entryId !== id)
        );
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };

  if (isLoading) {
    return <div className="max-w-2xl mx-auto p-4">공유된 일기를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">커뮤니티 일기</h1>

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

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400">공유된 일기가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-2">
                      {entry.profile_image ? (
                        <img 
                          src={`http://localhost:3001/uploads/${entry.profile_image}`} 
                          alt={entry.username} 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs">{entry.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{entry.username}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                </div>
                <span className="text-2xl">{getEmotionIcon(entry.rating)}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">{entry.content}</p>

              <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => toggleLike(entry.id)}
                  className={`flex items-center space-x-1 ${
                    entry.is_liked ? "text-rose-500 dark:text-rose-400" : ""
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>{entry.likes}</span>
                </button>

                <button 
                  className="flex items-center space-x-1"
                  onClick={() => router.push(`/community/${entry.id}`)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{entry.comment_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


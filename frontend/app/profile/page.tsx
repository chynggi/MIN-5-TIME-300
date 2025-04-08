'use client';

import { useState, useEffect } from 'react';
import { MainNavigation } from "@/components/main-navigation";
import { Settings, Users, Book, Heart, Upload, Loader2 } from "lucide-react";
import { profileService, ProfileData } from "@/lib/api/profile";
import Image from "next/image";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const profileData = await profileService.getProfile();
        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('프로필 로딩 중 오류 발생:', err);
        setError('프로필을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // 프로필 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    try {
      setLoading(true);
      const { profileImage } = await profileService.uploadProfileImage(file);
      // 프로필 상태 업데이트 - 백엔드 응답 형식에 맞춤
      setProfile(prev => prev ? { ...prev, profileImage } : null);
    } catch (err) {
      console.error('이미지 업로드 중 오류 발생:', err);
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">프로필을 불러오는 중...</p>
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="font-bold">5MIN</span>
          </div>
          <button className="rounded-full p-1 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="bg-card rounded-xl p-6 flex flex-col items-center">
                <div className="relative w-24 h-24">
                  {profile?.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.username}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <label htmlFor="profile-image" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold">{profile?.username}</h2>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {profile?.mbti && (
                  <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                    {profile.mbti}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4 md:w-2/3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-4">
                  <p className="text-muted-foreground text-sm">일기</p>
                  <p className="text-2xl font-bold">{profile?.stats?.diaryCount || 0}</p>
                </div>
                <div className="bg-card rounded-xl p-4">
                  <p className="text-muted-foreground text-sm">친구</p>
                  <p className="text-2xl font-bold">{profile?.stats?.friendCount || 0}</p>
                </div>
                <div className="bg-card rounded-xl p-4">
                  <p className="text-muted-foreground text-sm">좋아요</p>
                  <p className="text-2xl font-bold">{profile?.stats?.likeCount || 0}</p>
                </div>
              </div>
              
              <div className="bg-card rounded-xl p-4">
                <h3 className="font-medium">자기소개</h3>
                <p className="text-muted-foreground mt-2">{profile?.bio || '자기소개가 없습니다.'}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-yellow-100 flex items-center gap-4 cursor-pointer hover:bg-yellow-200 transition-colors">
              <Settings className="h-6 w-6 text-yellow-700" />
              <div>
                <h3 className="font-medium">설정</h3>
                <p className="text-sm text-muted-foreground">앱 설정 관리</p>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-pink-100 flex items-center gap-4 cursor-pointer hover:bg-pink-200 transition-colors">
              <Users className="h-6 w-6 text-pink-700" />
              <div>
                <h3 className="font-medium">친구 관리</h3>
                <p className="text-sm text-muted-foreground">친구 목록 확인</p>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-green-100 flex items-center gap-4 cursor-pointer hover:bg-green-200 transition-colors">
              <Book className="h-6 w-6 text-green-700" />
              <div>
                <h3 className="font-medium">일기장</h3>
                <p className="text-sm text-muted-foreground">내 일기 모아보기</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface SearchUser {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
}

interface RecommendUser {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string;
}

interface FriendSearchProps {
  className?: string;
}

export default function FriendSearch({ className = '' }: FriendSearchProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 추천 친구 가져오기
  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/friends/recommend');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('추천 친구 조회 실패:', error);
    }
  };

  // 검색 실행
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 디바운스된 검색
  const loadRecommendations = async () => {
    try {
      const response = await api.get('/friends/recommend');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('추천 친구 로딩 오류:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // 컴포넌트 마운트 시 추천 친구 로딩
    loadRecommendations();
  }, []);

  // 검색창 열기/닫기
  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setShowRecommendations(false);
    } else {
      setIsSearchOpen(true);
      fetchRecommendations(); // 검색창 열 때 추천 친구 로드
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // 외부 클릭 시 검색창 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // 사용자 프로필로 이동
  const handleRecommendFollow = async (user: RecommendUser) => {
    try {
      const response = await api.post('/friends/follow', {
        targetUserId: user.id
      });
      
      if (response.data.success) {
        // 추천 목록에서 제거
        setRecommendations(prev => prev.filter(rec => rec.id !== user.id));
        alert(`${user.username}님을 팔로우했습니다.`);
      }
    } catch (error) {
      console.error('팔로우 오류:', error);
      alert('팔로우에 실패했습니다.');
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 친구 요청 또는 팔로우 토글
  const handleFollowToggle = async (user: SearchUser) => {
    try {
      if (user.isFollowing) {
        // 언팔로우
        await api.delete(`/friends/follow/${user.id}`);
      } else {
        // 팔로우
        await api.post('/friends/follow', { targetUserId: user.id });
      }
      
      // 검색 결과 업데이트
      setSearchResults(prev => 
        prev.map(u => 
          u.id === user.id 
            ? { ...u, isFollowing: !u.isFollowing }
            : u
        )
      );
      
      // 성공 메시지 표시
      if (user.isFollowing) {
        console.log(`${user.username}님을 언팔로우했습니다.`);
      } else {
        console.log(`${user.username}님을 팔로우했습니다.`);
      }
    } catch (error: any) {
      console.error('팔로우 토글 실패:', error);
      // 실패 시 사용자에게 알림
      alert(error.response?.data?.message || '팔로우 처리에 실패했습니다.');
    }
  };

  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
      {/* 검색 버튼/검색창 */}
      <div className="flex items-center">
        {!isSearchOpen ? (
          <button
            onClick={toggleSearch}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
            aria-label="친구 검색"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center bg-white border-2 border-blue-400 rounded-full px-4 py-2 shadow-lg min-w-[300px]">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="사용자 ID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
            <button
              onClick={toggleSearch}
              className="ml-2 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {/* 탭 메뉴 */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setShowRecommendations(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                !showRecommendations ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              검색 결과
            </button>
            <button
              onClick={() => setShowRecommendations(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                showRecommendations ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              추천 친구 ({recommendations.length})
            </button>
          </div>

          {/* 검색 결과 탭 */}
          {!showRecommendations && (
            <>
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  검색 중...
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  검색 결과가 없습니다.
                </div>
              ) : searchQuery ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((user) => (
                    <div key={user.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">👤</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          {user.mbti && (
                            <div className="text-xs text-gray-500">{user.mbti}</div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleFollowToggle(user)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          user.isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {user.isFollowing ? '팔로잉' : '팔로우'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  사용자 ID로 검색해보세요
                </div>
              )}
            </>
          )}

          {/* 추천 친구 탭 */}
          {showRecommendations && (
            <>
              {recommendations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  추천할 친구가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recommendations.map((user) => (
                    <div key={user.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">👤</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          {user.mbti && (
                            <div className="text-xs text-gray-500">{user.mbti}</div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRecommendFollow(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        친구 요청
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

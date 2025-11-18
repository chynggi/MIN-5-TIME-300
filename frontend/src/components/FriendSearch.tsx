'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { followApi } from '@/services/follow-api';

type InterestKey = 'music' | 'movies' | 'art' | 'games';
type LifestyleTimeKey = 'sun' | 'moon' | 'question';
type SocialPersonaFilter = '집순이' | '집돌이' | '밖순이' | '밖돌이';

interface SearchUser {
  id: string;
  username: string;
  mbti?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
  followStatus?: 'none' | 'active' | 'requested';
  age?: number | null;
  lastActiveAt?: string | null;
  lifestyleTime?: LifestyleTimeKey;
  lifestyleSocial?: SocialPersonaFilter | 'unknown';
  matchedInterests?: string[];
  compatibilityScore?: number;
}

interface FilterState {
  age: [number, number];
  mbti: string[];
  interests: InterestKey[];
  lifestyleTime: LifestyleTimeKey[];
  socialType: '' | SocialPersonaFilter;
}

interface FriendSearchProps {
  className?: string;
}

const MBTI_TYPES = [
  'INTJ',
  'INTP',
  'INFJ',
  'INFP',
  'ISTJ',
  'ISTP',
  'ISFJ',
  'ISFP',
  'ENTJ',
  'ENTP',
  'ENFJ',
  'ENFP',
  'ESTJ',
  'ESTP',
  'ESFJ',
  'ESFP',
];

const INTEREST_OPTIONS: { key: InterestKey; label: string; icon: string }[] = [
  { key: 'music', label: '음악', icon: '🎵' },
  { key: 'movies', label: '영화/영상', icon: '🎬' },
  { key: 'art', label: '예술/디자인', icon: '🎨' },
  { key: 'games', label: '게임', icon: '🎮' },
];

const LIFESTYLE_TIME_OPTIONS: {
  key: LifestyleTimeKey;
  label: string;
  icon: string;
}[] = [
  { key: 'sun', label: '아침형', icon: '☀️' },
  { key: 'moon', label: '저녁형', icon: '🌙' },
  { key: 'question', label: '균형/미정', icon: '❔' },
];

const SOCIAL_PERSONA_OPTIONS: {
  value: '' | SocialPersonaFilter;
  label: string;
}[] = [
  { value: '', label: '라이프 스타일 타입 전체' },
  { value: '집순이', label: '집순이 · 혼자 좋아 + 여성' },
  { value: '집돌이', label: '집돌이 · 혼자 좋아 + 남성' },
  { value: '밖순이', label: '밖순이 · 사람 좋아 + 여성' },
  { value: '밖돌이', label: '밖돌이 · 사람 좋아 + 남성' },
];

const AGE_MIN = 18;
const AGE_MAX = 100;

const createDefaultFilters = (): FilterState => ({
  age: [AGE_MIN, AGE_MAX],
  mbti: [],
  interests: [],
  lifestyleTime: [],
  socialType: '',
});

const cloneFilters = (filters: FilterState): FilterState => ({
  age: [...filters.age] as [number, number],
  mbti: [...filters.mbti],
  interests: [...filters.interests],
  lifestyleTime: [...filters.lifestyleTime],
  socialType: filters.socialType,
});

const lifestyleEmojiMap: Record<LifestyleTimeKey, string> = {
  sun: '☀️',
  moon: '🌙',
  question: '❔',
};

const lifestyleLabelMap: Record<LifestyleTimeKey, string> = {
  sun: '아침형',
  moon: '저녁형',
  question: '밸런스',
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return '';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return '';
  const diffMs = Date.now() - timestamp.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return timestamp.toLocaleDateString();
};

export default function FriendSearch({ className = '' }: FriendSearchProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(
    createDefaultFilters,
  );
  const [draftFilters, setDraftFilters] = useState<FilterState>(
    createDefaultFilters,
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (
      appliedFilters.age[0] !== AGE_MIN ||
      appliedFilters.age[1] !== AGE_MAX
    ) {
      count += 1;
    }
    if (appliedFilters.mbti.length) count += 1;
    if (appliedFilters.interests.length) count += 1;
    if (appliedFilters.lifestyleTime.length) count += 1;
    if (appliedFilters.socialType) count += 1;
    return count;
  }, [appliedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (
      appliedFilters.age[0] !== AGE_MIN ||
      appliedFilters.age[1] !== AGE_MAX
    ) {
      chips.push(`나이 ${appliedFilters.age[0]}-${appliedFilters.age[1]}`);
    }
    chips.push(...appliedFilters.mbti);
    chips.push(
      ...appliedFilters.interests.map(
        (key) => INTEREST_OPTIONS.find((option) => option.key === key)?.label || key,
      ),
    );
    chips.push(
      ...appliedFilters.lifestyleTime.map((key) => lifestyleLabelMap[key]),
    );
    if (appliedFilters.socialType) chips.push(appliedFilters.socialType);
    return chips;
  }, [appliedFilters]);

  const buildFilterQuery = () => {
    const params = new URLSearchParams();
    const trimmed = searchQuery.trim();
    params.set('limit', '20');
    if (trimmed) params.set('q', trimmed);
    if (appliedFilters.age[0] !== AGE_MIN) {
      params.set('minAge', String(appliedFilters.age[0]));
    }
    if (appliedFilters.age[1] !== AGE_MAX) {
      params.set('maxAge', String(appliedFilters.age[1]));
    }
    if (appliedFilters.mbti.length) {
      params.set('mbti', appliedFilters.mbti.join(','));
    }
    if (appliedFilters.interests.length) {
      params.set('interestTags', appliedFilters.interests.join(','));
    }
    if (appliedFilters.lifestyleTime.length) {
      params.set('timePref', appliedFilters.lifestyleTime.join(','));
    }
    if (appliedFilters.socialType) {
      params.set('socialType', appliedFilters.socialType);
    }
    return params;
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildFilterQuery();
      const response = await api.get(`/users/search?${params.toString()}`);
      const users: SearchUser[] = (response.data?.users || []).map(
        (user: SearchUser) => ({
          ...user,
          followStatus: user.followStatus || 'none',
          isFollowing: Boolean(user.isFollowing && user.followStatus === 'active'),
        }),
      );
      setSearchResults(users);
    } catch (error) {
      console.error('검색 필터 조회 실패:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, appliedFilters]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(() => {
      performSearch();
    }, 320);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen, performSearch]);

  useEffect(() => {
    if (!isSearchOpen) return;
    performSearch();
  }, [appliedFilters, isSearchOpen, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setIsFilterOpen(false);
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

  const syncDraftFilters = () => {
    setDraftFilters(cloneFilters(appliedFilters));
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setIsFilterOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    syncDraftFilters();
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);
    performSearch();
  };

  const toggleListValue = <T extends string>(
    key: 'mbti' | 'interests' | 'lifestyleTime',
    value: T,
  ) => {
    setDraftFilters((prev) => {
      const current = prev[key] as T[];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      return {
        ...prev,
        [key]: next,
      };
    });
  };

  const handleAgeChange = (index: 0 | 1, value: number) => {
    setDraftFilters((prev) => {
      const nextAge: [number, number] = [...prev.age] as [number, number];
      nextAge[index] = value;
      if (index === 0 && value > nextAge[1]) {
        nextAge[1] = value;
      }
      if (index === 1 && value < nextAge[0]) {
        nextAge[0] = value;
      }
      return { ...prev, age: nextAge };
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters(cloneFilters(draftFilters));
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const defaults = createDefaultFilters();
    setDraftFilters(defaults);
    setAppliedFilters(cloneFilters(defaults));
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    setIsSearchOpen(false);
    setIsFilterOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleFollowToggle = async (user: SearchUser) => {
    try {
      if (user.isFollowing || user.followStatus === 'active') {
        await followApi.unfollowUser(user.id);
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === user.id
              ? { ...item, isFollowing: false, followStatus: 'none' as const }
              : item,
          ),
        );
        return;
      }

      if (user.followStatus === 'requested') {
        await followApi.unfollowUser(user.id);
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === user.id
              ? { ...item, followStatus: 'none' as const }
              : item,
          ),
        );
        return;
      }

      const response = await followApi.followUser(user.id);
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isFollowing: response.status === 'ACTIVE',
                followStatus:
                  response.status === 'ACTIVE' ? 'active' : 'requested',
              }
            : item,
        ),
      );
    } catch (error: any) {
      console.error('팔로우 토글 실패:', error);
      alert(error?.message || '팔로우 처리 중 문제가 발생했습니다.');
    }
  };

  const renderFilterPanel = () => (
    <div className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-md p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
          <span>나이 범위</span>
          <span className="text-blue-600">
            {draftFilters.age[0]} - {draftFilters.age[1]}세
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={draftFilters.age[0]}
            onChange={(e) => handleAgeChange(0, Number(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min={AGE_MIN}
            max={AGE_MAX}
            value={draftFilters.age[1]}
            onChange={(e) => handleAgeChange(1, Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">MBTI</div>
        <div className="grid grid-cols-4 gap-2">
          {MBTI_TYPES.map((type) => {
            const selected = draftFilters.mbti.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleListValue('mbti', type)}
                className={`rounded-lg border px-2 py-1 text-xs ${
                  selected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          관심사 카테고리
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((option) => {
            const selected = draftFilters.interests.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleListValue('interests', option.key)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                  selected
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          라이프 스타일 (시간대)
        </div>
        <div className="flex gap-2">
          {LIFESTYLE_TIME_OPTIONS.map((option) => {
            const selected = draftFilters.lifestyleTime.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleListValue('lifestyleTime', option.key)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                  selected
                    ? 'border-purple-500 bg-purple-50 text-purple-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="text-lg mr-1">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          라이프 스타일 (집/밖 타입)
        </div>
        <select
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={draftFilters.socialType}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              socialType: e.target.value as '' | SocialPersonaFilter,
            }))
          }
        >
          {SOCIAL_PERSONA_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleResetFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          초기화
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            필터 적용
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
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
          <div className="flex flex-col min-w-[320px]">
            <div className="flex items-center bg-white border-2 border-blue-400 rounded-full px-3 py-2 shadow-lg gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isFilterOpen) {
                    syncDraftFilters();
                  }
                  setIsFilterOpen((prev) => !prev);
                }}
                className="relative rounded-full p-2 hover:bg-blue-50 transition-colors"
                aria-label="검색 필터 열기"
              >
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19l-6 3v-9.586L3.293 6.707A1 1 0 013 6V4z"
                  />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="이름 또는 ID로 찾아보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
              <button
                onClick={toggleSearch}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {activeFilterChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[520px] overflow-y-auto z-50 p-4 space-y-4">
          {isFilterOpen && renderFilterPanel()}

          {!isFilterOpen && (
            <div>
              {loading ? (
                <div className="py-10 text-center text-gray-500">검색 중...</div>
              ) : searchResults.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  조건에 맞는 친구가 아직 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                    >
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-3 text-left"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">👤</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {user.username}
                            </span>
                            {user.mbti && (
                              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {user.mbti}
                              </span>
                            )}
                            {typeof user.compatibilityScore === 'number' &&
                              user.compatibilityScore > 0 && (
                                <span className="text-[11px] font-semibold text-amber-600">
                                  공감 +{user.compatibilityScore}
                                </span>
                              )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-gray-500">
                            {user.age ? <span>만 {user.age}세</span> : null}
                            {user.lifestyleTime && (
                              <span>
                                {lifestyleEmojiMap[user.lifestyleTime]}{' '}
                                {lifestyleLabelMap[user.lifestyleTime]}
                              </span>
                            )}
                            {user.lifestyleSocial &&
                              user.lifestyleSocial !== 'unknown' && (
                                <span>{user.lifestyleSocial}</span>
                              )}
                            {user.lastActiveAt && (
                              <span>최근 {formatRelativeTime(user.lastActiveAt)}</span>
                            )}
                          </div>
                          {user.matchedInterests && user.matchedInterests.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {user.matchedInterests.map((tag) => (
                                <span
                                  key={`${user.id}-${tag}`}
                                  className="text-[11px] bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(user)}
                        className={`ml-3 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          user.isFollowing || user.followStatus === 'active'
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : user.followStatus === 'requested'
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {user.isFollowing || user.followStatus === 'active'
                          ? '팔로잉'
                          : user.followStatus === 'requested'
                          ? '요청됨'
                          : '팔로우'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import apiRequest from "../../lib/api";

// Spotify 트랙 데이터 구조 정의
interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    images: { url: string }[];
  };
}

// 컴포넌트 Props 정의
interface MusicSettingProps {
  onMusicSelect: (track: SpotifyTrack | null) => void;
  selectedTrack: SpotifyTrack | null;
}

/**
 * 음악 설정 컴포넌트
 * Spotify API를 통해 음악을 검색하고, 선택하며, 미리들을 수 있는 기능을 제공합니다.
 * @param onMusicSelect - 음악 트랙 선택 시 호출되는 콜백 함수
 * @param selectedTrack - 현재 선택된 음악 트랙
 */
export default function MusicSetting({ onMusicSelect, selectedTrack }: MusicSettingProps) {
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularTracks, setPopularTracks] = useState<SpotifyTrack[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // 오디오 객체와 타임아웃 참조 관리
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 오디오 재생 정리 함수
  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCurrentPlayingId(null);
    setAudioProgress(0);
  };

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return cleanupAudio;
  }, []);

  // 인기곡 로드
  useEffect(() => {
    const loadPopularTracks = async () => {
      setLoadingPopular(true);
      try {
        const data = await apiRequest('/spotify/popular?category=toplists&limit=10');
        setPopularTracks(data.tracks || []);
      } catch (error: any) {
        console.error('인기곡 로드 실패:', error);
        setSearchError('인기곡을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingPopular(false);
      }
    };
    loadPopularTracks();
  }, []);

  // Spotify 음악 검색
  const searchSpotify = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    cleanupAudio();
    try {
      const data = await apiRequest(`/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.tracks?.items || []);
    } catch (error: any) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 음악 미리듣기 재생/정지
  const playPreview = (track: SpotifyTrack) => {
    if (currentPlayingId === track.id) {
      cleanupAudio();
      return;
    }
    cleanupAudio();
    if (track.preview_url) {
      setCurrentPlayingId(track.id);
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.play().catch(err => {
        console.error("오디오 재생 실패:", err);
        cleanupAudio();
      });
      audioRef.current.onended = cleanupAudio;
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current?.duration) {
          setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      }, 100);
    }
  };

  // 트랙 선택 처리
  const handleTrackSelect = (track: SpotifyTrack) => {
    onMusicSelect(track);
    setShowSearch(false);
    cleanupAudio();
  };

  // 선택된 트랙 제거
  const removeTrack = () => {
    onMusicSelect(null);
    cleanupAudio();
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // 트랙 목록 렌더링 함수
  const renderTrackList = (tracks: SpotifyTrack[]) => (
    tracks.map((track) => (
      <div
        key={track.id}
        role="listitem"
        tabIndex={0}
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:bg-gray-50`}
        onClick={() => handleTrackSelect(track)}
        onKeyDown={(e) => handleKeyDown(e, () => handleTrackSelect(track))}
        aria-label={`${track.name} - ${track.artists.map(a => a.name).join(', ')} 선택하기`}
      >
        {currentPlayingId === track.id && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" aria-hidden="true"></div>}
        <img src={track.album.images[0]?.url || '/images/music/placeholder.jpg'} alt={`${track.name} 앨범 커버`} className="w-10 h-10 rounded object-cover mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm truncate ${currentPlayingId === track.id ? 'text-blue-700' : ''}`}>{track.name}</div>
          <div className="text-xs text-gray-600 truncate">{track.artists.map(artist => artist.name).join(", ")}</div>
        </div>
        {track.preview_url && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); playPreview(track); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); playPreview(track); } }}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${currentPlayingId === track.id ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-label={currentPlayingId === track.id ? `${track.name} 재생 중지` : `${track.name} 미리듣기`}
          >
            {currentPlayingId === track.id ? '⏸️' : '▶️'}
          </button>
        )}
      </div>
    ))
  );

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4" role="region" aria-labelledby="music-setting-heading">
      <div className="flex items-center justify-between mb-3">
        <h3 id="music-setting-heading" className="text-sm font-semibold text-gray-700">음악 설정</h3>
  {/* 음악 검색 버튼 제거: 검색 진입은 빈 상태 클릭으로만 가능 */}
      </div>

      {/* 선택된 음악 표시 */}
      {selectedTrack ? (
        <div className="bg-white rounded-lg p-3 mb-3 border" role="group" aria-label="선택된 음악">
          <div className="flex items-center">
            <img src={selectedTrack.album.images[0]?.url || "/images/music/placeholder.jpg"} alt={`${selectedTrack.name} 앨범 커버`} className="w-12 h-12 rounded object-cover mr-3" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{selectedTrack.name}</div>
              <div className="text-xs text-gray-600 truncate">{selectedTrack.artists.map(artist => artist.name).join(", ")}</div>
            </div>
            <div className="flex items-center gap-2">
              {selectedTrack.preview_url && (
                <button type="button" onClick={() => playPreview(selectedTrack)} className={`p-2 rounded-full transition-colors ${currentPlayingId === selectedTrack.id ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} aria-label={currentPlayingId === selectedTrack.id ? "재생 중지" : "미리듣기"}>
                  {currentPlayingId === selectedTrack.id ? '⏸️' : '▶️'}
                </button>
              )}
              <button type="button" onClick={removeTrack} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors" aria-label="선택된 음악 제거">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {currentPlayingId === selectedTrack.id && (
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-blue-600" style={{ width: `${audioProgress}%` }} role="progressbar" aria-valuenow={Math.round(audioProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="재생 진행률"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="bg-white rounded-lg p-3 mb-3 border-2 border-dashed border-gray-300 text-center text-gray-500 cursor-pointer hover:bg-gray-50 focus:bg-gray-100 transition-colors"
          role="button"
          tabIndex={0}
          aria-label="일기와 어울리는 음악을 선택해보세요. 클릭하면 음악 검색 화면이 열립니다."
          onClick={() => setShowSearch(true)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSearch(true); } }}
        >
          <div className="text-2xl mb-1" aria-hidden="true">🎵</div>
          <div className="text-sm">일기와 어울리는 음악을 선택해보세요.</div>
        </div>
      )}

      {/* 음악 검색 */}
      {showSearch && (
        <div className="space-y-3" id="music-search-panel">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="음악 제목이나 아티스트를 검색하세요"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              onKeyPress={(e) => e.key === "Enter" && searchSpotify()}
              aria-label="음악 검색어 입력"
            />
            <button
              type="button"
              onClick={searchSpotify}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="음악 검색 실행"
            >
              {isSearching ? "검색중..." : "검색"}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto" role="list" aria-label="음악 목록">
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3" role="alert">
                <div className="flex items-center text-red-700">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{searchError}</span>
                </div>
                <button
                  onClick={() => setSearchError(null)}
                  className="text-xs text-red-600 underline mt-2 min-h-[44px] sm:min-h-0 flex items-center"
                  aria-label="오류 메시지 닫기"
                >
                  다시 시도
                </button>
              </div>
            )}
            {isSearching && (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-hidden="true"></div>
                <span className="ml-2 text-sm text-gray-600">검색 중...</span>
              </div>
            )}
            {!isSearching && hasSearched && searchResults.length === 0 && !searchError && (
              <div className="text-center py-8" role="status">
                <div className="text-4xl mb-2" aria-hidden="true">🔍</div>
                <div className="text-sm text-gray-600 mb-2">검색 결과가 없습니다</div>
                <div className="text-xs text-gray-500">다른 키워드로 검색해보세요</div>
              </div>
            )}
            {!isSearching && !searchError && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600">
                    {hasSearched && searchResults.length > 0 ? `검색 결과 (${searchResults.length}곡)` : "인기 추천 곡"}
                  </div>
                  {!hasSearched && loadingPopular && (
                    <div className="text-xs text-gray-500" aria-live="polite">로딩중...</div>
                  )}
                </div>
                {!loadingPopular && (
                  <>
                    {renderTrackList(searchResults.length > 0 ? searchResults : popularTracks)}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

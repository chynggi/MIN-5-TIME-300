"use client";
import { useState, useEffect } from "react";

interface MusicSettingProps {
  onMusicSelect: (track: SpotifyTrack | null) => void;
  selectedTrack: SpotifyTrack | null;
}

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

export default function MusicSetting({ onMusicSelect, selectedTrack }: MusicSettingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<HTMLAudioElement | null>(null);

  // 인기 추천 곡들 (실제로는 Spotify API에서 가져와야 함)
  const popularTracks: SpotifyTrack[] = [
    {
      id: "1",
      name: "좋은 날",
      artists: [{ name: "아이유" }],
      preview_url: null,
      external_urls: { spotify: "#" },
      album: { images: [{ url: "/images/music/placeholder.jpg" }] }
    },
    {
      id: "2", 
      name: "Spring Day",
      artists: [{ name: "BTS" }],
      preview_url: null,
      external_urls: { spotify: "#" },
      album: { images: [{ url: "/images/music/placeholder.jpg" }] }
    },
  ];

  const searchSpotify = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // TODO: 실제 Spotify API 호출
      // const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      // const data = await response.json();
      // setSearchResults(data.tracks.items);
      
      // 임시 데이터
      setSearchResults([
        {
          id: "search1",
          name: searchQuery,
          artists: [{ name: "검색 결과" }],
          preview_url: null,
          external_urls: { spotify: "#" },
          album: { images: [{ url: "/images/music/placeholder.jpg" }] }
        }
      ]);
    } catch (error) {
      console.error("음악 검색 실패:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (currentPlaying) {
      currentPlaying.pause();
      setCurrentPlaying(null);
    }

    if (track.preview_url) {
      const audio = new Audio(track.preview_url);
      audio.play();
      setCurrentPlaying(audio);
      
      audio.onended = () => {
        setCurrentPlaying(null);
      };
    }
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    onMusicSelect(track);
    setShowSearch(false);
    if (currentPlaying) {
      currentPlaying.pause();
      setCurrentPlaying(null);
    }
  };

  const removeTrack = () => {
    onMusicSelect(null);
    if (currentPlaying) {
      currentPlaying.pause();
      setCurrentPlaying(null);
    }
  };

  useEffect(() => {
    return () => {
      if (currentPlaying) {
        currentPlaying.pause();
      }
    };
  }, [currentPlaying]);

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">음악 설정</h3>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="text-xs text-blue-600 underline"
        >
          {showSearch ? "검색 닫기" : "음악 검색"}
        </button>
      </div>

      {/* 선택된 음악 표시 */}
      {selectedTrack ? (
        <div className="bg-white rounded-lg p-3 mb-3 border">
          <div className="flex items-center">
            <img 
              src={selectedTrack.album.images[0]?.url || "/images/music/placeholder.jpg"} 
              alt={selectedTrack.name}
              className="w-12 h-12 rounded object-cover mr-3"
            />
            <div className="flex-1">
              <div className="font-semibold text-sm">{selectedTrack.name}</div>
              <div className="text-xs text-gray-600">
                {selectedTrack.artists.map(artist => artist.name).join(", ")}
              </div>
            </div>
            <div className="flex gap-2">
              {selectedTrack.preview_url && (
                <button
                  type="button"
                  onClick={() => playPreview(selectedTrack)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  ▶️
                </button>
              )}
              <button
                type="button"
                onClick={removeTrack}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-3 mb-3 border-2 border-dashed border-gray-300 text-center text-gray-500">
          <div className="text-2xl mb-1">🎵</div>
          <div className="text-sm">음악을 선택해주세요</div>
        </div>
      )}

      {/* 음악 검색 */}
      {showSearch && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="음악 제목이나 아티스트를 검색하세요"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              onKeyPress={(e) => e.key === "Enter" && searchSpotify()}
            />
            <button
              type="button"
              onClick={searchSpotify}
              disabled={isSearching}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50"
            >
              {isSearching ? "검색중..." : "검색"}
            </button>
          </div>

          {/* 검색 결과 또는 인기 곡 */}
          <div className="max-h-60 overflow-y-auto">
            <div className="text-xs text-gray-600 mb-2">
              {searchResults.length > 0 ? "검색 결과" : "인기 추천 곡"}
            </div>
            {(searchResults.length > 0 ? searchResults : popularTracks).map((track) => (
              <div
                key={track.id}
                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleTrackSelect(track)}
              >
                <img 
                  src={track.album.images[0]?.url || "/images/music/placeholder.jpg"}
                  alt={track.name}
                  className="w-10 h-10 rounded object-cover mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{track.name}</div>
                  <div className="text-xs text-gray-600">
                    {track.artists.map(artist => artist.name).join(", ")}
                  </div>
                </div>
                {track.preview_url && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPreview(track);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    ▶️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

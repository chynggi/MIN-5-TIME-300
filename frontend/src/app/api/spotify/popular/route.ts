import { NextRequest, NextResponse } from 'next/server';

// Spotify API 토큰을 가져오는 함수
async function getSpotifyToken() {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!client_id || !client_secret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'toplists'; // 기본값: 인기 차트
    const limit = searchParams.get('limit') || '10';
    
    // Spotify API 토큰 가져오기
    const token = await getSpotifyToken();

    let tracks = [];

    if (category === 'toplists') {
      // 한국 인기 차트에서 트랙 가져오기
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/37i9dQZEVXbNxXF4SkHj9F/tracks?market=KR&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        tracks = playlistData.items.map((item: any) => item.track).filter((track: any) => track);
      }
    } else if (category === 'new-releases') {
      // 새로운 릴리즈
      const newReleasesResponse = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?country=KR&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (newReleasesResponse.ok) {
        const newReleasesData = await newReleasesResponse.json();
        // 앨범에서 첫 번째 트랙 가져오기
        const albumPromises = newReleasesData.albums.items.slice(0, parseInt(limit)).map(async (album: any) => {
          const albumTracksResponse = await fetch(
            `https://api.spotify.com/v1/albums/${album.id}/tracks?market=KR&limit=1`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (albumTracksResponse.ok) {
            const albumTracksData = await albumTracksResponse.json();
            const track = albumTracksData.items[0];
            if (track) {
              // 앨범 이미지 정보 추가
              track.album = album;
              return track;
            }
          }
          return null;
        });
        
        const albumTracks = await Promise.all(albumPromises);
        tracks = albumTracks.filter(track => track);
      }
    } else {
      // 기본적으로 K-pop 장르의 인기곡
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=genre:k-pop&type=track&market=KR&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        tracks = searchData.tracks.items;
      }
    }

    // 응답 데이터 형식 정리
    const formattedTracks = tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({ name: artist.name })),
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      album: {
        images: track.album.images
      }
    }));

    return NextResponse.json({
      tracks: formattedTracks
    });

  } catch (error) {
    console.error('Spotify popular tracks API error:', error);
    
    // 에러 발생시 기본 추천 곡 반환
    const fallbackTracks = [
      {
        id: "fallback1",
        name: "좋은 날",
        artists: [{ name: "아이유" }],
        preview_url: null,
        external_urls: { spotify: "#" },
        album: { images: [{ url: "/images/music/placeholder.jpg" }] }
      },
      {
        id: "fallback2",
        name: "Spring Day",
        artists: [{ name: "BTS" }],
        preview_url: null,
        external_urls: { spotify: "#" },
        album: { images: [{ url: "/images/music/placeholder.jpg" }] }
      },
      {
        id: "fallback3",
        name: "LOVE DIVE",
        artists: [{ name: "IVE" }],
        preview_url: null,
        external_urls: { spotify: "#" },
        album: { images: [{ url: "/images/music/placeholder.jpg" }] }
      },
      {
        id: "fallback4",
        name: "Next Level",
        artists: [{ name: "aespa" }],
        preview_url: null,
        external_urls: { spotify: "#" },
        album: { images: [{ url: "/images/music/placeholder.jpg" }] }
      }
    ];

    return NextResponse.json({
      tracks: fallbackTracks
    });
  }
}
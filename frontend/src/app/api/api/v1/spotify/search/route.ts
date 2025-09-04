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
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Spotify API 토큰 가져오기
    const token = await getSpotifyToken();

    // Spotify API에서 음악 검색
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=KR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Spotify search failed');
    }

    const searchData = await searchResponse.json();
    
    return NextResponse.json({
      tracks: {
        items: searchData.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist: any) => ({ name: artist.name })),
          preview_url: track.preview_url,
          external_urls: track.external_urls,
          album: {
            images: track.album.images
          }
        }))
      }
    });

  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to search music' }, 
      { status: 500 }
    );
  }
}

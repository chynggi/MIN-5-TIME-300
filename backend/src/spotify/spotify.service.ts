import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface SpotifyArtist { name: string }
interface SpotifyImage { url: string }
export interface SpotifyTrackFormatted {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: { images: SpotifyImage[] };
}

@Injectable()
export class SpotifyService {
  private token: string | null = null;
  private tokenExpiresAt = 0; // epoch ms

  private async fetchToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new HttpException('Spotify credentials not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // 캐시 유효
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      throw new HttpException('Failed to get Spotify token', HttpStatus.BAD_GATEWAY);
    }
    const data = await res.json();
    this.token = data.access_token;
    // 토큰 만료 1시간 - 1분 여유
    this.tokenExpiresAt = Date.now() + (data.expires_in ? (data.expires_in - 60) * 1000 : 3000);
    return this.token!;
  }

  private mapTrack(track: any): SpotifyTrackFormatted {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists?.map((a: any) => ({ name: a.name })) || [],
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      album: { images: track.album?.images || [] },
    };
  }

  async searchTracks(q: string): Promise<{ tracks: { items: SpotifyTrackFormatted[] } }> {
    if (!q) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }
    const token = await this.fetchToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10&market=KR`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new HttpException('Spotify search failed', HttpStatus.BAD_GATEWAY);
    }
    const data = await res.json();
    const items = (data.tracks?.items || []).map((t: any) => this.mapTrack(t));
    return { tracks: { items } };
  }

  async getPopular(category = 'toplists', limitStr = '10'): Promise<{ tracks: SpotifyTrackFormatted[] }> {
    const limit = parseInt(limitStr, 10) || 10;
    let token: string | null = null;
    try {
      token = await this.fetchToken();
    } catch (e) {
      // 자격 증명 미설정 혹은 토큰 오류 시 빈 목록 반환 (하드코딩 제거)
      return { tracks: [] };
    }

    // 시나리오별 동적 수집: 1) toplists (KR Top 50) 2) Global Top 50 3) K-POP 장르 검색 4) 신규 발매 대표 트랙
    const playlistCandidates = [
      // 대한민국 Top 50 (공식 Spotify 플레이리스트 ID)
      '37i9dQZEVXbNxXF4SkHj9F',
      // Global Top 50
      '37i9dQZEVXbMDoHDwVN2tF',
    ];

    const collected: any[] = [];

    const authHeader = { Authorization: `Bearer ${token}` };

    const tryFetchJson = async (url: string) => {
      try {
        const r = await fetch(url, { headers: authHeader });
        if (!r.ok) return null;
        return await r.json();
      } catch (e) {
        return null;
      }
    };

    // 1. 플레이리스트 기반 수집
    if (category === 'toplists') {
      for (const pid of playlistCandidates) {
        if (collected.length >= limit) break;
        const data = await tryFetchJson(`https://api.spotify.com/v1/playlists/${pid}/tracks?market=KR&limit=${limit}`);
        if (data?.items?.length) {
          for (const item of data.items) {
            if (item.track) collected.push(item.track);
            if (collected.length >= limit) break;
          }
        }
      }
    }

    // 2. new-releases (필요 시 첫 트랙) - category === 'new-releases' 이거나 toplists 실패시
    if ((category === 'new-releases' || !collected.length) && collected.length < limit) {
      const newData = await tryFetchJson(`https://api.spotify.com/v1/browse/new-releases?country=KR&limit=${Math.min(limit, 20)}`);
      if (newData?.albums?.items?.length) {
        for (const album of newData.albums.items) {
          if (collected.length >= limit) break;
          // 각 앨범 대표 트랙 (첫 번째 트랙)
          const albumTracks = await tryFetchJson(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=KR&limit=1`);
            const first = albumTracks?.items?.[0];
            if (first) {
              first.album = album; // 이미지 정보 보강
              collected.push(first);
            }
        }
      }
    }

    // 3. 장르 검색 (k-pop) - 아직 부족하면 보충
    if (collected.length < limit) {
      const genreData = await tryFetchJson(`https://api.spotify.com/v1/search?q=genre:k-pop&type=track&market=KR&limit=${limit}`);
      if (genreData?.tracks?.items?.length) {
        for (const t of genreData.tracks.items) {
          collected.push(t);
          if (collected.length >= limit) break;
        }
      }
    }

    // 중복 제거 (트랙 ID 기준) 및 자르기
    const uniqueMap = new Map<string, any>();
    for (const t of collected) {
      if (!t?.id) continue;
      if (!uniqueMap.has(t.id)) uniqueMap.set(t.id, t);
      if (uniqueMap.size >= limit) break;
    }

    const tracks = Array.from(uniqueMap.values()).map((t) => this.mapTrack(t));
    return { tracks };
  }

  async getRecommendations(seedGenres = 'k-pop,pop', limitStr = '10'): Promise<{ tracks: SpotifyTrackFormatted[] }> {
    const limit = parseInt(limitStr, 10) || 10;
    let token: string | null = null;
    try {
      token = await this.fetchToken();
    } catch (e) {
      return { tracks: [] };
    }
    const res = await fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&seed_genres=${encodeURIComponent(seedGenres)}&market=KR`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { tracks: [] };
    const data = await res.json();
    const items = (data.tracks || []).map((t: any) => this.mapTrack(t));
    return { tracks: items };
  }
}

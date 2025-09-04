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
    const token = await this.fetchToken();
    let collected: any[] = [];
    try {
      if (category === 'toplists') {
        const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/37i9dQZEVXbNxXF4SkHj9F/tracks?market=KR&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (playlistRes.ok) {
          const playlistData = await playlistRes.json();
            collected = playlistData.items.map((i: any) => i.track).filter((t: any) => t);
        }
      } else if (category === 'new-releases') {
        const newRes = await fetch(`https://api.spotify.com/v1/browse/new-releases?country=KR&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (newRes.ok) {
          const newData = await newRes.json();
          const albumPromises = newData.albums.items.slice(0, limit).map(async (album: any) => {
            const albumTracksRes = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=KR&limit=1`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (albumTracksRes.ok) {
              const albumTracksData = await albumTracksRes.json();
              const track = albumTracksData.items[0];
              if (track) {
                track.album = album; // enrich images
                return track;
              }
            }
            return null;
          });
          collected = (await Promise.all(albumPromises)).filter(Boolean) as any[];
        }
      } else { // fallback k-pop genre
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=genre:k-pop&type=track&market=KR&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          collected = searchData.tracks.items;
        }
      }
    } catch (e) {
      // swallow and fallback below
      console.error('Spotify popular fetch error', e);
    }
    let tracks: SpotifyTrackFormatted[];
    if (!collected.length) {
      tracks = [
        { id: 'fallback1', name: '좋은 날', artists: [{ name: '아이유' }], preview_url: null, external_urls: { spotify: '#' }, album: { images: [{ url: '/images/music/placeholder.jpg' }] } },
        { id: 'fallback2', name: 'Spring Day', artists: [{ name: 'BTS' }], preview_url: null, external_urls: { spotify: '#' }, album: { images: [{ url: '/images/music/placeholder.jpg' }] } },
        { id: 'fallback3', name: 'LOVE DIVE', artists: [{ name: 'IVE' }], preview_url: null, external_urls: { spotify: '#' }, album: { images: [{ url: '/images/music/placeholder.jpg' }] } },
        { id: 'fallback4', name: 'Next Level', artists: [{ name: 'aespa' }], preview_url: null, external_urls: { spotify: '#' }, album: { images: [{ url: '/images/music/placeholder.jpg' }] } },
      ];
    } else {
      tracks = collected.map((t) => this.mapTrack(t));
    }
    return { tracks };
  }
}

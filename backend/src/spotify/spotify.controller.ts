import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService, SpotifyTrackFormatted } from './spotify.service';

@Controller('api/v1/spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('search')
  async search(
    @Query('q') q: string,
  ): Promise<{ tracks: { items: SpotifyTrackFormatted[] } }> {
    return await this.spotifyService.searchTracks(q);
  }

  @Get('popular')
  async popular(
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ): Promise<{ tracks: SpotifyTrackFormatted[] }> {
    return await this.spotifyService.getPopular(category, limit);
  }

  @Get('recommendations')
  async recommendations(
    @Query('seedGenres') seedGenres?: string,
    @Query('limit') limit?: string,
  ): Promise<{ tracks: SpotifyTrackFormatted[] }> {
    return await this.spotifyService.getRecommendations(seedGenres, limit);
  }
}

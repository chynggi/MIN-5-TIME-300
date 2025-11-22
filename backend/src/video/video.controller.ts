import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('recommendation')
  async getRecommendation(@Query('interest') interest?: string) {
    return this.videoService.getRecommendation(interest);
  }
}

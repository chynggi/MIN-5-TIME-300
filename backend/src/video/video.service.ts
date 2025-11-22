import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly PEXELS_API_KEY = process.env.PEXELS_API_KEY || ''; // .env에서 키 관리 권장

  // 키가 없을 때 사용할 고품질 샘플 영상 목록 (Pexels/Pixabay 등에서 가져온 무료 소스)
  private readonly FALLBACK_VIDEOS = [
    {
      url: 'https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_24fps.mp4', // 바다/자연
      tags: ['nature', 'sea', 'calm'],
    },
    {
      url: 'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4', // 커피/카페
      tags: ['coffee', 'cafe', 'relax'],
    },
    {
      url: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4', // 숲/산책
      tags: ['forest', 'walk', 'green'],
    },
    {
      url: 'https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4', // 도시/야경
      tags: ['city', 'night', 'urban'],
    },
  ];

  async getRecommendation(query?: string): Promise<{ url: string; source: string; tags: string[] }> {
    // 1. 쿼리 처리: 쉼표로 구분된 관심사 중 하나를 랜덤 선택
    let search = 'nature'; // 기본값
    if (query) {
      const interests = query.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      if (interests.length > 0) {
        search = interests[Math.floor(Math.random() * interests.length)];
      }
    }

    this.logger.log(`Fetching video recommendation for query: "${query}", selected search term: "${search}"`);

    // 2. API 키가 있으면 Pexels API 호출 시도
    if (this.PEXELS_API_KEY) {
      try {
        const response = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(search)}&per_page=5&orientation=landscape`,
          {
            headers: {
              Authorization: this.PEXELS_API_KEY,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            // 랜덤으로 하나 선택
            const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];
            // 가장 적절한 화질 선택 (HD급)
            const videoFile =
              randomVideo.video_files.find((f: any) => f.width >= 1280 && f.width <= 1920) ||
              randomVideo.video_files[0];

            this.logger.log(`Successfully fetched video from Pexels for tag: "${search}"`);
            return {
              url: videoFile.link,
              source: 'Pexels API',
              tags: [search],
            };
          }
        } else {
          this.logger.warn(`Pexels API Error: ${response.statusText}`);
        }
      } catch (error) {
        this.logger.error('Failed to fetch from Pexels', error);
      }
    }

    // 2. 실패하거나 키가 없으면 폴백 목록에서 랜덤 반환
    this.logger.log(`Using fallback video for query: "${query}"`);
    // 쿼리가 있다면 태그 매칭 시도 (간단한 필터링)
    let candidates = this.FALLBACK_VIDEOS;
    if (query) {
      const filtered = this.FALLBACK_VIDEOS.filter((v) =>
        v.tags.some((tag) => tag.includes(query.toLowerCase())),
      );
      if (filtered.length > 0) candidates = filtered;
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      url: selected.url,
      source: 'Fallback (Local)',
      tags: selected.tags,
    };
  }
}

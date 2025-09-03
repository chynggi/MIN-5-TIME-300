import { Body, Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, UploadedFile, UseInterceptors, UseFilters } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { RateDiaryDto } from './dto/rate-diary.dto';
import { DiaryListResponseDto, DiaryDetailResponseDto } from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';
import { VectorDbService } from '../vector-db/vector-db.service';
import { diaryMediaUploadOptions } from '../common/config/multer.config';
import { FileUploadExceptionFilter } from '../common/filters/file-upload-exception.filter';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/diaries')
export class DiaryController {
  constructor(
    private readonly diaryService: DiaryService,
    private readonly vectorDbService: VectorDbService,
  ) {}

  @Get('today-question')
  async getTodayQuestion(@Req() req): Promise<TodayQuestionResponseDto> {
    return this.diaryService.getTodayQuestion(req);
  }

  @Get()
  async getDiaries(@Req() req, @Query() query): Promise<DiaryListResponseDto> {
    return this.diaryService.getDiaries(req, query);
  }

  /**
   * 공개 일기 목록 (커뮤니티 지도 등에서 사용)
   * GET /api/v1/diaries/public
   * - 인증 필요 (팔로우/친구 관계 정책 적용 전 기본 보호)
   * - 추후 캐싱/페이징 가능
   */
  @Get('public')
  async getPublicDiaries(@Req() req, @Query() query) {
    return this.diaryService.getPublicDiaries(req, query);
  }

  /**
   * 오늘 작성된 맞팔 친구들의 공개 일기 목록
   * GET /api/v1/diaries/friends/today
   */
  @Get('friends/today')
  async getFriendsTodayDiaries(@Req() req) {
    return this.diaryService.getFriendsTodayDiaries(req);
  }

  @Get(':id')
  async getDiary(@Req() req, @Param('id') id: string): Promise<DiaryDetailResponseDto> {
    return this.diaryService.getDiary(req, id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', diaryMediaUploadOptions))
  @UseFilters(FileUploadExceptionFilter)
  async createDiary(
    @Req() req,
    @Body() dto: CreateDiaryDto,
    @UploadedFile() file?: Multer.File,
  ): Promise<{ id: string; content: string; createdAt: string; isPublic: boolean; question: string; mediaUrl?: string; mediaType?: string; lat?: number | null; lng?: number | null }> {
    // 디버깅: 들어온 FormData 필드 로그
    try {
      console.log('[CreateDiary] raw body dto:', dto);
      if (file) {
        console.log('[CreateDiary] uploaded file:', { originalname: file.originalname, mimetype: file.mimetype, size: file.size });
      }
    } catch (e) { /* ignore */ }
    return this.diaryService.createDiary(req, dto, file);
  }

  @Post(':id/rate')
  async rateDiary(@Req() req, @Param('id') id: string, @Body() dto: RateDiaryDto): Promise<{ id: string; emotionScore: number; updatedAt: string }> {
    return this.diaryService.rateDiary(req, id, dto);
  }

  @Put(':id/share')
  async shareDiary(@Req() req, @Param('id') id: string, @Body('isPublic') isPublic: boolean): Promise<{ id: string; isPublic: boolean; updatedAt: string }> {
    return this.diaryService.shareDiary(req, id, isPublic);
  }

  /**
   * 입력 텍스트(또는 최근 일기) 기반 유사 일기 추천
   */
  @Post('search-similar')
  async searchSimilarDiaries(@Req() req, @Body('text') text?: string, @Body('limit') limit = 5) {
    return this.diaryService.searchSimilarDiaries(req, text, limit);
  }


  // === Reactions (Like) ===
  @Post(':id/like')
  async toggleLike(@Req() req, @Param('id') id: string) {
    return this.diaryService.toggleLike(req, id);
  }

  @Get(':id/like')
  async getLikeStatus(@Req() req, @Param('id') id: string) {
    return this.diaryService.getLikeStatus(req, id);
  }
}

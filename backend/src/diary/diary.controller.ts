import { Body, Controller, Get, Post, Put, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { RateDiaryDto } from './dto/rate-diary.dto';
import { DiaryListResponseDto, DiaryDetailResponseDto } from './dto/diary-response.dto';
import { TodayQuestionResponseDto } from './dto/today-question-response.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/diaries')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get('today-question')
  async getTodayQuestion(@Req() req): Promise<TodayQuestionResponseDto> {
    return this.diaryService.getTodayQuestion(req);
  }

  @Get()
  async getDiaries(@Req() req, @Query() query): Promise<DiaryListResponseDto> {
    return this.diaryService.getDiaries(req, query);
  }

  @Get(':id')
  async getDiary(@Req() req, @Param('id') id: string): Promise<DiaryDetailResponseDto> {
    return this.diaryService.getDiary(req, id);
  }

  @Post()
  async createDiary(@Req() req, @Body() dto: CreateDiaryDto): Promise<{ id: string; content: string; createdAt: string; isPublic: boolean; question: string }> {
    return this.diaryService.createDiary(req, dto);
  }

  @Post(':id/rate')
  async rateDiary(@Req() req, @Param('id') id: string, @Body() dto: RateDiaryDto): Promise<{ id: string; emotionScore: number; updatedAt: string }> {
    return this.diaryService.rateDiary(req, id, dto);
  }

  @Put(':id/share')
  async shareDiary(@Req() req, @Param('id') id: string, @Body('isPublic') isPublic: boolean): Promise<{ id: string; isPublic: boolean; updatedAt: string }> {
    return this.diaryService.shareDiary(req, id, isPublic);
  }
}

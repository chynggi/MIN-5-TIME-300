import { Body, Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';
import { CommunityDiaryListResponseDto } from './dto/community-diary.dto';
import { FeedbackDto, FeedbackResponseDto } from './dto/feedback.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('diaries')
  async getDiaries(@Req() req, @Query() query): Promise<CommunityDiaryListResponseDto> {
    return this.communityService.getDiaries(req, query);
  }

  @Post('diaries')
  async createDiary(@Req() req, @Body() dto: any) {
    return this.communityService.createDiary(req, dto);
  }

  @Get('diaries/:id')
  async getDiary(@Req() req, @Param('id') id: string) {
    return this.communityService.getDiary(req, id);
  }

  @Put('diaries/:id')
  async updateDiary(@Req() req, @Param('id') id: string, @Body() dto: any) {
    return this.communityService.updateDiary(req, id, dto);
  }

  @Delete('diaries/:id')
  async deleteDiary(@Req() req, @Param('id') id: string) {
    return this.communityService.deleteDiary(req, id);
  }

  @Post('diaries/:id/feedback')
  async feedback(@Req() req, @Param('id') id: string, @Body() dto: FeedbackDto): Promise<FeedbackResponseDto> {
    return this.communityService.feedback(req, id, dto);
  }
}

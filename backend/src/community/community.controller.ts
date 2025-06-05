import { Body, Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
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

  @Post('diaries/:id/feedback')
  async feedback(@Req() req, @Param('id') id: string, @Body() dto: FeedbackDto): Promise<FeedbackResponseDto> {
    return this.communityService.feedback(req, id, dto);
  }
}

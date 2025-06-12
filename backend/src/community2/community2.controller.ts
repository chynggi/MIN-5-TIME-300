import { Body, Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Community2Service } from './community2.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/community2')
export class Community2Controller {
  constructor(private readonly community2Service: Community2Service) {}

  @Get('public-diaries')
  async getPublicDiaries(@Req() req, @Query() query) {
    return this.community2Service.getPublicDiaries(req, query);
  }

  @Post('public-diaries')
  async createPublicDiary(@Req() req, @Body() dto: any) {
    return this.community2Service.createPublicDiary(req, dto);
  }

  @Get('public-diaries/:id')
  async getPublicDiary(@Req() req, @Param('id') id: string) {
    return this.community2Service.getPublicDiary(req, id);
  }

  @Put('public-diaries/:id')
  async updatePublicDiary(@Req() req, @Param('id') id: string, @Body() dto: any) {
    return this.community2Service.updatePublicDiary(req, id, dto);
  }

  @Delete('public-diaries/:id')
  async deletePublicDiary(@Req() req, @Param('id') id: string) {
    return this.community2Service.deletePublicDiary(req, id);
  }
}

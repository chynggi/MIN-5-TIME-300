import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiariesService } from './diaries.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('diaries')
@Controller('diaries')
export class DiariesController {
  constructor(private readonly diariesService: DiariesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 일기 작성' })
  @ApiResponse({ status: 201, description: '일기가 성공적으로 생성됨' })
  async create(@Body() createDiaryDto: CreateDiaryDto, @Req() req) {
    const userId = req.user.id;
    return this.diariesService.create(userId, createDiaryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 일기 목록 조회' })
  async findUserEntries(@Req() req) {
    return this.diariesService.findUserEntries(req.user.id);
  }

  @Get('shared')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '공개된 일기 목록 조회' })
  @ApiQuery({ name: 'cursor', required: false, description: '커서 ID' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  async findShared(
    @Query('cursor') cursor: string,
    @Query('limit') limit: number,
    @Req() req
  ) {
    return this.diariesService.findSharedEntries(cursor, limit || 10, req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '오늘 일기 작성 여부 확인' })
  async getStatus(@Req() req) {
    const hasWrittenDiary = await this.diariesService.hasWrittenToday(req.user.id);
    return { status: hasWrittenDiary  };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 일기 조회' })
  @ApiParam({ name: 'id', description: '일기 ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.diariesService.findOne(+id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '일기 수정' })
  @ApiParam({ name: 'id', description: '일기 ID' })
  async update(
    @Param('id') id: string,
    @Body() updateDiaryDto: UpdateDiaryDto,
    @Req() req
  ) {
    return this.diariesService.update(+id, req.user.id, updateDiaryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '일기 삭제' })
  @ApiParam({ name: 'id', description: '일기 ID' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.diariesService.remove(+id, req.user.id);
  }
}
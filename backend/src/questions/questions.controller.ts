import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string; username: string; email: string };
}

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 질문 생성' })
  @ApiResponse({ status: 201, description: '질문이 성공적으로 생성됨' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    return this.questionsService.create(createQuestionDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '모든 질문 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  findAll(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('tags') tags?: string[],
  ) {
    return this.questionsService.findAll(+page, +limit, search, tags);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 질문 조회' })
  @ApiResponse({ status: 200, description: '질문 조회 성공' })
  @ApiResponse({ status: 404, description: '질문을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 업데이트' })
  @ApiResponse({ status: 200, description: '질문 업데이트 성공' })
  @ApiResponse({ status: 403, description: '질문 수정 권한 없음' })
  update(
    @Param('id') id: string, 
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user.id;
    return this.questionsService.update(+id, updateQuestionDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 삭제' })
  @ApiResponse({ status: 200, description: '질문 삭제 성공' })
  @ApiResponse({ status: 403, description: '질문 삭제 권한 없음' })
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user.id;
    return this.questionsService.remove(+id, userId);
  }

  @Patch(':id/answered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 해결 상태 변경' })
  markAsAnswered(
    @Param('id') id: string,
    @Body('isAnswered') isAnswered: boolean,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user.id;
    return this.questionsService.markAsAnswered(+id, isAnswered, userId);
  }
}
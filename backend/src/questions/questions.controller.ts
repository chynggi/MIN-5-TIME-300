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
  @ApiOperation({ summary: '모든 질문 프롬프트 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: Number, description: '육하원칙 카테고리 ID' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('category') category?: string,
  ) {
    return this.questionsService.findAll(
      Number(page), 
      Number(limit), 
      search, 
      tags, 
      category !== undefined ? Number(category) : undefined
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 질문 조회' })
  @ApiResponse({ status: 200, description: '질문 조회 성공' })
  @ApiResponse({ status: 404, description: '질문을 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 업데이트' })
  @ApiResponse({ status: 200, description: '질문 업데이트 성공' })
  @ApiResponse({ status: 403, description: '질문 수정 권한 없음' })
  async update(
    @Param('id') id: string, 
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Query('userId') userId: string,
  ) {
    return this.questionsService.update(id, updateQuestionDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 삭제' })
  @ApiResponse({ status: 200, description: '질문 삭제 성공' })
  @ApiResponse({ status: 403, description: '질문 삭제 권한 없음' })
  async remove(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    return this.questionsService.remove(id, userId);
  }

  @Patch(':id/answered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '질문 해결 상태 변경' })
  async markAsAnswered(
    @Param('id') id: string,
    @Query('isAnswered') isAnswered: string,
    @Query('userId') userId: string,
  ) {
    // isAnswered를 boolean으로 변환 필요
    return this.questionsService.markAsAnswered(id, isAnswered === 'true', userId);
  }

  // 카테고리 목록 조회 API 추가
  @Get('categories')
  @ApiOperation({ summary: '육하원칙 기반 질문 카테고리 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '육하원칙(5W1H) 카테고리 목록', 
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  })
  getCategories() {
    return this.questionsService.getCategories();
  }
}
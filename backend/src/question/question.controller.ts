import { Body, Controller, Get, Post, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuestionService } from './question.service';
import { RateCacheService } from '../common/services/rate-cache.service';
import { TodayQuestionDto } from './dto/today-question.dto'; // 기존 DTO (단일 질문) - 유지
import { VoteQuestionDto } from './dto/vote-question.dto';
import { AIModel } from './interfaces/question-generator.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService, private readonly rate: RateCacheService) {}

  @Get('today')
  async getToday(@Req() req): Promise<TodayQuestionDto> {
    return this.questionService.getToday(req);
  }

  @Post('vote')
  async vote(@Req() req, @Body() dto: VoteQuestionDto): Promise<{ success: boolean; message: string }> {
    return this.questionService.vote(req, dto);
  }

  @Post('generate')
  async generate(
    @Req() req, 
    @Query('model') model?: string
  ): Promise<any> { // 다중 질문 세트 반환
    const userId = req.user.userId;
    if (!this.rate.isAllowed(`qgen:${userId}`, 2)) {
      return { ok: false, message: '질문 생성 요청이 너무 잦아요. 잠시 후 다시 시도해주세요.' };
    }
    const aiModel = model && Object.values(AIModel).includes(model as AIModel) 
      ? (model as AIModel) 
      : undefined;
    return this.questionService.generate(req, aiModel);
  }

  @Get('models')
  async getAvailableModels(): Promise<{
    models: string[];
    defaultModel: string;
    enabledModels: string[];
  }> {
    return this.questionService.getAvailableModels();
  }
}

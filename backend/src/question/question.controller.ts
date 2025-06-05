import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuestionService } from './question.service';
import { TodayQuestionDto } from './dto/today-question.dto';
import { VoteQuestionDto } from './dto/vote-question.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('today')
  async getToday(@Req() req): Promise<TodayQuestionDto> {
    return this.questionService.getToday(req);
  }

  @Post('vote')
  async vote(@Req() req, @Body() dto: VoteQuestionDto): Promise<{ success: boolean; message: string }> {
    return this.questionService.vote(req, dto);
  }

  @Post('generate')
  async generate(@Req() req): Promise<TodayQuestionDto> {
    return this.questionService.generate(req);
  }
}

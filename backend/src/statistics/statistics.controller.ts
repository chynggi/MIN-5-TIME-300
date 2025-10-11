import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { DashboardStatisticsDto } from './dto/dashboard.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  async getDashboard(
    @Req() req,
    @Query('period') period?: 'recent7' | 'week' | 'month' | 'year',
  ): Promise<DashboardStatisticsDto> {
    return this.statisticsService.getDashboard(req, period);
  }

  @Get('lpg-score')
  async getLPGScore(@Req() req) {
    return this.statisticsService.getLPGScore(req);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { GetRecommendationsQueryDto } from './dto/get-recommendations-query.dto';
import { Recommendation } from './entities/recommendation.entity';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  create(@Body() createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
    return this.recommendationsService.create(createRecommendationDto);
  }

  @Get()
  findAll(@Query() query: GetRecommendationsQueryDto) {
    return this.recommendationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Recommendation> {
    return this.recommendationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecommendationDto: UpdateRecommendationDto,
  ): Promise<Recommendation> {
    return this.recommendationsService.update(id, updateRecommendationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.recommendationsService.remove(id);
  }

  @Get('user/:userId')
  getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<Recommendation[]> {
    return this.recommendationsService.getUserRecommendations(userId, limit);
  }

  @Patch(':id/seen')
  markAsSeen(@Param('id') id: string): Promise<Recommendation> {
    return this.recommendationsService.markAsSeen(id);
  }
}
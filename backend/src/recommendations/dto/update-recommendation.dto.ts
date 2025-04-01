import { PartialType } from '@nestjs/swagger';
import { CreateRecommendationDto } from './create-recommendation.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRecommendationDto extends PartialType(CreateRecommendationDto) {
  @IsOptional()
  @IsBoolean()
  isSeen?: boolean;
}
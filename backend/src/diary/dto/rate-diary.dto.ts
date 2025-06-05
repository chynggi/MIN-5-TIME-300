import { IsInt, Min, Max } from 'class-validator';

export class RateDiaryDto {
  @IsInt()
  @Min(1)
  @Max(5)
  emotionScore: number;
}

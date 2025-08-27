import { IsOptional, IsInt, Min, Max, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FollowListQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string; // Base64 encoded cursor

  @IsOptional()
  @IsDateString()
  cursorCreatedAt?: string;

  @IsOptional()
  @IsString()
  cursorUserId?: string;
}
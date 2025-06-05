import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  content: string;

  @IsString()
  questionId: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsInt()
  @Min(1)
  writingDuration: number;
}

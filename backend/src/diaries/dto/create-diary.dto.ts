import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDiaryDto {
  @ApiProperty({ description: '일기 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '일기 내용' })
  @IsString()
  content: string;

  @ApiProperty({ description: '기분 상태', required: false })
  @IsString()
  @IsOptional()
  mood?: string;

  @ApiProperty({ description: '날씨', required: false })
  @IsString()
  @IsOptional()
  weather?: string;
  
  @ApiProperty({ description: '공개 여부 (기본값: 비공개)', default: true })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = true;
  
  @ApiProperty({ description: '태그 목록', type: [String], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
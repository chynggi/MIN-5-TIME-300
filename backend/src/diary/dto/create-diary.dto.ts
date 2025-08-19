import { IsString, IsOptional } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  isPublic?: any; // FormData에서 문자열로 전달되므로 any 타입 사용

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

  writingDuration: any; // FormData에서 문자열로 전달되므로 any 타입 사용
  
  @IsOptional()
  lat?: any;

  @IsOptional()
  lng?: any;
}

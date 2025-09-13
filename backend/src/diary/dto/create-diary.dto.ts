import { IsString, IsOptional, IsBooleanString, IsNumberString } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  @IsString()
  questionModel?: string; // 질문 생성에 사용된 AI 모델 id (요약 모델 동기화 목적)

  @IsOptional()
  @IsBooleanString()
  isPublic?: string; // 'true' | 'false'

  @IsOptional()
  @IsString()
  emotion?: string; // 감정 이모지 필드 추가

  @IsOptional()
  @IsString()
  diaryDate?: string; // 일기 날짜 필드 추가 (ISO 문자열)

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsNumberString()
  writingDuration: string; // FormData에서 문자열로 전달
  
  @IsOptional()
  @IsNumberString()
  lat?: string;

  @IsOptional()
  @IsNumberString()
  lng?: string;
}

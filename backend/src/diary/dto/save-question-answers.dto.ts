import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QAItemDto {
  @IsString()
  domain!: string; // emotion|relationship|recovery|action|goal 등

  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

export class SaveQuestionAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QAItemDto)
  qa!: QAItemDto[]; // 1~5개 기대

  @IsOptional()
  @IsString()
  modelId?: string; // 요약/생성 모델

  @IsOptional()
  @IsString()
  diaryDate?: string; // 해당 날짜 일기(없으면 생성)
}

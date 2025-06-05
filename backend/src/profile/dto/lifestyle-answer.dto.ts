import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class LifestyleAnswerInputDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class LifestyleAnswerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LifestyleAnswerInputDto)
  answers: LifestyleAnswerInputDto[];
}

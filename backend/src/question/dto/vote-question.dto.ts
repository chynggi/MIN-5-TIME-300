import { IsString, IsBoolean } from 'class-validator';

export class VoteQuestionDto {
  @IsString()
  questionId: string;

  @IsBoolean()
  isHelpful: boolean;
}

import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InterestDto {
  @IsString()
  interest: string;

  @IsOptional()
  priority?: number;
}

export class LifestyleAnswerDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestDto)
  interests?: InterestDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LifestyleAnswerDto)
  lifestyle?: LifestyleAnswerDto[];
}

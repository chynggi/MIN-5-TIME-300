import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
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

// NOTE: emitDecoratorMetadata가 설계 타입을 평가할 때 TDZ를 피하기 위해 먼저 선언
export class BaselineCheckinDto {
  @IsInt() @Min(1) @Max(10) mood_1to10!: number;
  @IsInt() @Min(1) @Max(10) energy_1to10!: number;
  @IsInt() @Min(1) @Max(10) stress_1to10!: number;
  @IsInt() @Min(1) @Max(9)  sleep_hours_1to9p!: number; // 9=9+ 버킷
  @IsInt() @Min(1) @Max(10) sleep_quality_1to10!: number;
  @IsArray() activity_types!: string[]; // 프리지정 셋: 운동/명상/스트레칭/산책
  @IsInt() @Min(0) @Max(10) workout_intensity_1to10!: number; // 운동 포함 시 1~10, 아니면 0
  @IsInt() @Min(1) @Max(10) focus_1to10!: number;
  @IsInt() @Min(1) @Max(10) fatigue_1to10!: number;
  @IsInt() @Min(1) @Max(10) social_count_1to10!: number;
  @IsInt() @Min(1) @Max(10) social_satisfaction_1to10!: number;
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

  // 회원가입 베이스라인 체크인(선택)
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineCheckinDto)
  baseline?: BaselineCheckinDto;
}

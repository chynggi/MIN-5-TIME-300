import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  mbti?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

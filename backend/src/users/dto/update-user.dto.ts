import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '비밀번호', required: false })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 하나 이상의 대소문자, 숫자, 특수문자를 포함해야 합니다',
  })
  password?: string;

  @ApiProperty({ description: '이메일', required: false })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해야 합니다' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'MBTI 유형', required: false })
  @IsString()
  @IsOptional()
  mbti?: string;

  @ApiProperty({ description: '프로필 이미지 경로', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '사용자명', example: 'john_doe' })
  @IsString()
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다' })
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 하나 이상의 대소문자, 숫자, 특수문자를 포함해야 합니다',
  })
  password: string;

  @ApiProperty({ description: '이메일', example: 'john@example.com', required: false })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해야 합니다' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'MBTI 유형', example: 'INTJ', required: false })
  @IsString()
  @IsOptional()
  mbti?: string;
}
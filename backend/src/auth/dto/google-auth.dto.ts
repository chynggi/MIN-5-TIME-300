import { IsString, IsEmail, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ 
    description: 'Google 사용자 고유 ID',
    example: '123456789',
    type: String 
  })
  @IsString()
  sub: string;

  @ApiProperty({ 
    description: '사용자 이메일',
    example: 'user@example.com',
    type: String 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: '사용자 이름',
    example: 'John Doe',
    type: String 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: '프로필 이미지 URL',
    example: 'https://lh3.googleusercontent.com/...',
    type: String,
    required: false 
  })
  @IsUrl()
  @IsOptional()
  picture?: string;
}
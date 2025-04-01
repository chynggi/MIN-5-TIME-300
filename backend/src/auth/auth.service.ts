import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    // 기존 사용자 확인
    let user = await this.prisma.user.findUnique({
      where: {
        email: googleAuthDto.email,
      },
    });

    // 새 사용자인 경우 생성
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleAuthDto.email,
          username: googleAuthDto.name,
          profile_image: googleAuthDto.picture,
          googleId: googleAuthDto.sub,
          provider: 'google',
        },
      });
    }

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile_image: user.profile_image,
      },
    };
  }
}
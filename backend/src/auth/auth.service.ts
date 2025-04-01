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

  // Google 인증 URL 생성 메서드 추가
  getGoogleAuthURL() {
    // 구글 OAuth URL 생성 로직 구현
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scope = 'email profile';
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  }

  // Google 인증 처리 메서드 추가
  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto) {
    return this.googleAuth(googleAuthDto);
  }

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
          profileImage: googleAuthDto.picture,
          googleId: googleAuthDto.sub,
          password: null, // 비밀번호는 필요 없음
          // isAdmin: false, // 기본값으로 설정
          // mbti: null, // 기본값으로 설정
          // loginAttempts: 0, // 기본값으로 설정
          // lastLoginAttempt: null, // 기본값으로 설정
          // createdAt: new Date(), // 기본값으로 설정
          // updatedAt: new Date(), // 기본값으로 설정
          // questions: [], // 기본값으로 설정
          // provider 필드 제거
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
        profileImage: user.profileImage,
      },
    };
  }
}
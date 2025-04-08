import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import axios from 'axios'; // Google API 호출을 위해 axios 사용

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
    let user = await this.prisma.user.findFirst({
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
          //password: null, // 비밀번호는 필요 없음
          // isAdmin: false, // 기본값으로 설정
          // mbti: null, // 기본값으로 설정
          // loginAttempts: 0, // 기본값으로 설정
          // lastLoginAttempt: null, // 기본값으로 설정
          // createdAt: new Date(), // 기본값으로 설정
          // updatedAt: new Date(), // 기본값으로 설정
          // questions: [], // 기본값으로 설정
          provider: 'google', // 구글 로그인으로 설정
          // 추가 필드들에 대한 기본값 설정
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

  getServiceAuthURL(service: string): string {
    switch (service) {
      case 'google':
        return this.getGoogleAuthURL();
      case 'facebook':
        return this.getFacebookAuthURL();
      case 'github':
        return this.getGithubAuthURL();
      default:
        throw new Error(`Unsupported service: ${service}`);
    }
  }

  async handleServiceAuthCallback(service: string, code: string) {
    switch (service) {
      case 'google':
        // Google API 호출
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        });

        const accessToken = tokenResponse.data.access_token;

        // 사용자 정보 가져오기
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const userInfo = userInfoResponse.data;

        // GoogleAuthDto 객체 생성
        const googleAuthDto: GoogleAuthDto = {
          sub: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        };

        return this.googleAuth(googleAuthDto);

      case 'facebook':
        return this.facebookAuth(code);

      case 'github':
        return this.githubAuth(code);

      default:
        throw new Error(`Unsupported service: ${service}`);
    }
  }

  getFacebookAuthURL(): string {
    // Facebook OAuth URL 생성 로직
    return 'https://www.facebook.com/v10.0/dialog/oauth?...';
  }

  getGithubAuthURL(): string {
    // GitHub OAuth URL 생성 로직
    return 'https://github.com/login/oauth/authorize?...';
  }

  async facebookAuth(code: string) {
    // Facebook 인증 처리 로직
  }

  async githubAuth(code: string) {
    // GitHub 인증 처리 로직
  }
}
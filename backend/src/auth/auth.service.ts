import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.BACKEND_URL}/auth/google/callback`,
    });
  }

  getGoogleAuthURL() {
    return this.googleClient.generateAuthUrl({
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      access_type: 'offline',
      prompt: 'consent',
    });
  }

  async googleAuth(code: string) {
    const { tokens } = await this.googleClient.getToken(code);
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Google authentication failed');
    }

    return this.authenticateWithGoogle({
      sub: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
    });
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: googleAuthDto.email },
          { googleId: googleAuthDto.sub },
        ],
      },
    });

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
    } else if (!user.googleId) {
      // 이메일로 가입한 사용자의 Google 계정 연동
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleAuthDto.sub,
          provider: 'google',
        },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile_image: user.profile_image,
      },
    };
  }
}
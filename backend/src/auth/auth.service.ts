import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 가입된 이메일입니다.');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        username: dto.username,
        mbti: dto.mbti,
      },
    });
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      token,
    };
  }

  async logout(req: any): Promise<LogoutResponseDto> {
    // JWT는 stateless이므로 클라이언트에서 토큰 삭제만으로 충분 (블랙리스트는 별도 구현 필요)
    return {
      success: true,
      message: '로그아웃 성공',
    };
  }
}

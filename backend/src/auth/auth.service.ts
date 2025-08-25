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
        birthDate: dto.birthDate,
        bio: dto.bio,
        // 추가 필드들 (나중에 확장 가능)
        // height: dto.height,
        // weight: dto.weight,
        // job: dto.job,
        // education: dto.education,
      },
    });

    // 관심사 저장
    if (dto.interests && dto.interests.length > 0) {
      const interestData = dto.interests.map((interest, index) => ({
        userId: user.id,
        interest: interest.interest,
        priority: interest.priority || (index + 1),
      }));
      
      await this.prisma.userInterest.createMany({
        data: interestData,
      });
    }

    // 라이프스타일 저장
    if (dto.lifestyle && dto.lifestyle.length > 0) {
      const lifestyleData = dto.lifestyle.map((life) => ({
        userId: user.id,
        question: life.question,
        answer: life.answer,
      }));
      
      await this.prisma.lifestyleAnswer.createMany({
        data: lifestyleData,
      });
    }

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
    console.log('로그인 시도:', dto.email); // 디버깅용 로그
    console.log('DB에서 조회된 사용자:', user); // 디버깅용 로그
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    console.log('비밀번호 검증 결과:', valid); // 디버깅용 로그
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const result = {
      id: user.id,
      email: user.email,
      username: user.username,
      token,
    };
    console.log('로그인 반환값:', result);
    return result;
  }

  async logout(req: any): Promise<LogoutResponseDto> {
    // JWT는 stateless이므로 클라이언트에서 토큰 삭제만으로 충분 (블랙리스트는 별도 구현 필요)
    return {
      success: true,
      message: '로그아웃 성공',
    };
  }
}

import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // 사용자명 중복 검사
    const existingUser = await this.prisma.user.findFirst({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 사용자명입니다');
    }

    // 이메일 중복 검사 (이메일이 제공된 경우)
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
    }

    // MBTI 유효성 검사
    if (createUserDto.mbti) {
      const validMbti = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
      if (!validMbti.includes(createUserDto.mbti.toUpperCase())) {
        throw new BadRequestException('유효하지 않은 MBTI 유형입니다');
      }
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        email: createUserDto.email,
        mbti: createUserDto.mbti?.toUpperCase(),
      },
    });

    // 비밀번호 필드 제외하고 반환
    const { password, ...result } = user;
    return result;
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 이메일 중복 검사 (다른 사용자의 이메일과 중복 방지)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
    }

    // MBTI 유효성 검사
    if (updateUserDto.mbti) {
      const validMbti = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
      if (!validMbti.includes(updateUserDto.mbti.toUpperCase())) {
        throw new BadRequestException('유효하지 않은 MBTI 유형입니다');
      }
    }

    // 업데이트할 데이터 준비
    const data: any = {};
    if (updateUserDto.email) data.email = updateUserDto.email;
    if (updateUserDto.mbti) data.mbti = updateUserDto.mbti.toUpperCase();
    if (updateUserDto.profileImage) data.profileImage = updateUserDto.profileImage;

    // 비밀번호가 제공된 경우 해싱
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 사용자 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // 비밀번호 필드 제외하고 반환
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string): Promise<Omit<User, 'password'>> {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 사용자 삭제
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    // 비밀번호 필드 제외하고 반환
    const { password, ...result } = deletedUser;
    return result;
  }

  async updateLoginAttempts(username: string, reset: boolean): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { username },
    });

    if (!user) return;

    if (reset) {
      await this.prisma.user.update({
        where: { id: user.id }, // id로 업데이트
        data: { 
          loginAttempts: 0,
          lastLoginAttempt: new Date()
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id }, // id로 업데이트
        data: { 
          loginAttempts: { increment: 1 },
          lastLoginAttempt: new Date()
        },
      });
    }
  }

  async getLoginAttempts(username: string): Promise<{ attempts: number, lastAttempt: Date | null }> {
    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { loginAttempts: true, lastLoginAttempt: true },
    });

    if (!user) {
      return { attempts: 0, lastAttempt: null };
    }

    return { 
      attempts: user.loginAttempts, 
      lastAttempt: user.lastLoginAttempt 
    };
  }

  async addInterest(userId: string, interest: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        interests: {
          push: interest,
        },
      },
    });
  }

  async updateInterest(userId: string, oldInterest: string, newInterest: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const updatedInterests = user.interests.map((i) => (i === oldInterest ? newInterest : i));

    return this.prisma.user.update({
      where: { id: userId },
      data: { interests: updatedInterests },
    });
  }

  async deleteInterest(userId: string, interest: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const filteredInterests = user.interests.filter((i) => i !== interest);

    return this.prisma.user.update({
      where: { id: userId },
      data: { interests: filteredInterests },
    });
  }
}
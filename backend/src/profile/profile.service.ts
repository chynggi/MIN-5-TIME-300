import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import { PrismaService } from '../prisma.service';
import { PersonaService } from './persona.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personaService: PersonaService,
  ) {}

  async getProfile(req: any): Promise<ProfileResponseDto> {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true,
      },
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      mbti: user.mbti ?? '',
      profileImageUrl: user.profileImageUrl || '',
      interests: user.interests.map(i => ({ id: i.id, interest: i.interest, priority: i.priority })),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(req: any, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const userId = req.user.userId;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        mbti: dto.mbti,
        profileImageUrl: dto.profileImageUrl,
      },
      include: { interests: true },
    });
    // 프로필 변경 시 페르소나/목표 자동 추출 및 DB 저장
    try {
      const personaAndGoals = await this.personaService.generatePersonaAndGoals(userId);
      await this.prisma.userPersona.upsert({
        where: { userId },
        update: {
          persona: personaAndGoals.persona || '',
          goals: JSON.stringify(personaAndGoals.goals || []),
        },
        create: {
          userId,
          persona: personaAndGoals.persona || '',
          goals: JSON.stringify(personaAndGoals.goals || []),
        },
      });
    } catch (e) {}
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      mbti: user.mbti ?? '',
      profileImageUrl: user.profileImageUrl || '',
      interests: user.interests.map(i => ({ id: i.id, interest: i.interest, priority: i.priority })),
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateInterests(req: any, dto: UpdateInterestsDto): Promise<{ success: boolean; interests: InterestResponseDto[] }> {
    const userId = req.user.userId;
    // 기존 관심사 삭제 후 새로 추가 (간단 구현)
    await this.prisma.userInterest.deleteMany({ where: { userId } });
    const created = await this.prisma.userInterest.createMany({
      data: dto.interests.map(i => ({ ...i, userId })),
      skipDuplicates: true,
    });
    const interests = await this.prisma.userInterest.findMany({ where: { userId } });
    // 관심사 변경 시 페르소나/목표 자동 추출 및 DB 저장
    try {
      const personaAndGoals = await this.personaService.generatePersonaAndGoals(userId);
      await this.prisma.userPersona.upsert({
        where: { userId },
        update: {
          persona: personaAndGoals.persona || '',
          goals: JSON.stringify(personaAndGoals.goals || []),
        },
        create: {
          userId,
          persona: personaAndGoals.persona || '',
          goals: JSON.stringify(personaAndGoals.goals || []),
        },
      });
    } catch (e) {}
    return {
      success: true,
      interests: interests.map(i => ({ id: i.id, interest: i.interest, priority: i.priority })),
    };
  }

  async answerLifestyle(req: any, dto: LifestyleAnswerDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    // 기존 답변 삭제 후 새로 추가 (간단 구현)
    await this.prisma.lifestyleAnswer.deleteMany({ where: { userId } });
    await this.prisma.lifestyleAnswer.createMany({
      data: dto.answers.map(a => ({ ...a, userId })),
      skipDuplicates: true,
    });
    return {
      success: true,
      message: '라이프스타일 답변 저장 완료',
    };
  }

  /**
   * DB에서 페르소나/목표 조회, 없으면 AI로 생성 후 저장(캐싱)
   */
  async getPersonaAndGoals(userId: string): Promise<{ persona: string; goals: string[] }> {
    const cached = await this.prisma.userPersona.findUnique({ where: { userId } });
    if (cached) {
      return {
        persona: cached.persona,
        goals: JSON.parse(cached.goals || '[]'),
      };
    }
    // 없으면 AI로 생성 후 저장
    const personaAndGoals = await this.personaService.generatePersonaAndGoals(userId);
    await this.prisma.userPersona.create({
      data: {
        userId,
        persona: personaAndGoals.persona || '',
        goals: JSON.stringify(personaAndGoals.goals || []),
      },
    });
    return personaAndGoals;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto, UpdateProfileImageDto, UpdatePrivacyDto, UpdateLifestyleDto, ProfileCompleteDto } from './dto/update-profile-extended.dto';
import { DetailedPrivacyDto, BlockUserDto, UnblockUserDto, PrivacySettingsResponseDto, VisibilityLevel } from './dto/privacy-settings.dto';
import { ProfileResponseDto, OtherProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import { PrismaService } from '../prisma.service';
import { PersonaService } from './persona.service';
import { StatisticsService } from '../statistics/statistics.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personaService: PersonaService,
    private readonly statisticsService: StatisticsService,
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
  /**
   * 타인 프로필 조회
   */
  async getOtherProfile(req: any, otherUsername: string): Promise<OtherProfileResponseDto> {
    const currentUserId = req.user.userId;
    // username 기반 조회
  const otherUser = await this.prisma.user.findFirst({ where: { username: otherUsername } });
    if (!otherUser) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const otherUserId = otherUser.id;
    // 공개 일기 수
    const diaryCount = await this.prisma.journal.count({ where: { userId: otherUserId, isPublic: true } });
    // 팔로워/팔로잉 카운트
    const followerCount = await this.prisma.friend.count({ where: { addresseeId: otherUserId, status: 'accepted' } });
    const followingCount = await this.prisma.friend.count({ where: { requesterId: otherUserId, status: 'accepted' } });
    // 현재 사용자 팔로우 상태
  const isFollowing = !!(await this.prisma.friend.findFirst({ where: { requesterId: currentUserId, addresseeId: otherUserId, status: 'accepted' } }));
    // LPG 점수 조회 (StatisticsService 이용)
    const lpgData = await this.statisticsService.getLPGScore({ user: { userId: otherUserId } });
    return {
      id: otherUser.id,
      username: otherUser.username,
      bio: otherUser.username,
      diaryCount,
      followerCount,
      followingCount,
      lpgScore: lpgData.lpgScore,
      isFollowing,
      isPublic: true,
  mbti: otherUser.mbti || '',
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

  // 새로운 프로필 편집 메서드들
  async updateBasicInfo(req: any, dto: UpdateBasicInfoDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        bio: dto.bio,
        mbti: dto.mbti,
        location: dto.location,
        birthDate: dto.birthDate,
      },
    });

    return {
      success: true,
      message: '기본 정보가 업데이트되었습니다.',
    };
  }

  async updateProfileImage(req: any, dto: UpdateProfileImageDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImageUrl: dto.profileImageUrl,
      },
    });

    return {
      success: true,
      message: '프로필 이미지가 업데이트되었습니다.',
    };
  }

  async updatePrivacy(req: any, dto: UpdatePrivacyDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isProfilePublic: dto.isProfilePublic,
        showMbti: dto.showMbti,
        showLocation: dto.showLocation,
        showBirthDate: dto.showBirthDate,
        allowFollowRequests: dto.allowFollowRequests,
        showDiariesToFriends: dto.showDiariesToFriends,
        showDiariesToPublic: dto.showDiariesToPublic,
      },
    });

    return {
      success: true,
      message: '개인정보 설정이 업데이트되었습니다.',
    };
  }

  async updateLifestyle(req: any, dto: UpdateLifestyleDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        workStyle: dto.workStyle,
        exerciseFrequency: dto.exerciseFrequency,
        sleepPattern: dto.sleepPattern,
        socialActivity: dto.socialActivity,
      },
    });

    return {
      success: true,
      message: '라이프스타일 정보가 업데이트되었습니다.',
    };
  }

  async updateCompleteProfile(req: any, dto: ProfileCompleteDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    
    // 트랜잭션으로 모든 업데이트를 한 번에 처리
    await this.prisma.$transaction(async (prisma) => {
      // 기본 정보 업데이트
      await prisma.user.update({
        where: { id: userId },
        data: {
          username: dto.basic.username,
          bio: dto.basic.bio,
          mbti: dto.basic.mbti,
          location: dto.basic.location,
          birthDate: dto.basic.birthDate,
          workStyle: dto.lifestyle.workStyle,
          exerciseFrequency: dto.lifestyle.exerciseFrequency,
          sleepPattern: dto.lifestyle.sleepPattern,
          socialActivity: dto.lifestyle.socialActivity,
          isProfilePublic: dto.privacy.isProfilePublic,
          showMbti: dto.privacy.showMbti,
          showLocation: dto.privacy.showLocation,
          showBirthDate: dto.privacy.showBirthDate,
          allowFollowRequests: dto.privacy.allowFollowRequests,
          showDiariesToFriends: dto.privacy.showDiariesToFriends,
          showDiariesToPublic: dto.privacy.showDiariesToPublic,
        },
      });

      // 관심사 업데이트
      if (dto.interests && dto.interests.length > 0) {
        // 기존 관심사 삭제
        await prisma.userInterest.deleteMany({ where: { userId } });
        
        // 새 관심사 추가
        await prisma.userInterest.createMany({
          data: dto.interests.map((interest, index) => ({
            userId,
            interest,
            priority: index + 1,
          })),
        });
      }
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
    } catch (e) {
      console.error('페르소나 생성 오류:', e);
    }

    return {
      success: true,
      message: '프로필이 완전히 업데이트되었습니다.',
    };
  }

  async getPrivacySettings(req: any): Promise<UpdatePrivacyDto> {
    const userId = req.user.userId;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isProfilePublic: true,
        showMbti: true,
        showLocation: true,
        showBirthDate: true,
        allowFollowRequests: true,
        showDiariesToFriends: true,
        showDiariesToPublic: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      isProfilePublic: user.isProfilePublic,
      showMbti: user.showMbti,
      showLocation: user.showLocation,
      showBirthDate: user.showBirthDate,
      allowFollowRequests: user.allowFollowRequests,
      showDiariesToFriends: user.showDiariesToFriends,
      showDiariesToPublic: user.showDiariesToPublic,
    };
  }

  // 고급 프라이버시 설정 메서드들
  async getDetailedPrivacySettings(req: any): Promise<PrivacySettingsResponseDto> {
    const userId = req.user.userId;
    
    // 프라이버시 설정이 없으면 기본값으로 생성
    let privacySettings = await this.prisma.privacySettings.findUnique({
      where: { userId },
    });

    if (!privacySettings) {
      privacySettings = await this.prisma.privacySettings.create({
        data: { userId },
      });
    }

    // 차단된 사용자 목록 조회
    const blockedUsers = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return {
      profileVisibility: privacySettings.profileVisibility as VisibilityLevel,
      mbtiVisibility: privacySettings.mbtiVisibility as VisibilityLevel,
      locationVisibility: privacySettings.locationVisibility as VisibilityLevel,
      birthDateVisibility: privacySettings.birthDateVisibility as VisibilityLevel,
      interestsVisibility: privacySettings.interestsVisibility as VisibilityLevel,
      lifestyleVisibility: privacySettings.lifestyleVisibility as VisibilityLevel,
      diaryDefaultVisibility: privacySettings.diaryDefaultVisibility as VisibilityLevel,
      allowFollowRequests: privacySettings.allowFollowRequests,
      showOnlineStatus: privacySettings.showOnlineStatus,
      allowDirectMessages: privacySettings.allowDirectMessages,
      showInRecommendations: privacySettings.showInRecommendations,
      blockedUsers: blockedUsers.map(block => ({
        id: block.blocked.id,
        username: block.blocked.username,
        profileImageUrl: block.blocked.profileImageUrl || undefined,
      })),
    };
  }

  async updateDetailedPrivacy(req: any, dto: DetailedPrivacyDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;

    // 프라이버시 설정 업데이트 (upsert 사용)
    await this.prisma.privacySettings.upsert({
      where: { userId },
      update: {
        profileVisibility: dto.profileVisibility,
        mbtiVisibility: dto.mbtiVisibility,
        locationVisibility: dto.locationVisibility,
        birthDateVisibility: dto.birthDateVisibility,
        interestsVisibility: dto.interestsVisibility,
        lifestyleVisibility: dto.lifestyleVisibility,
        diaryDefaultVisibility: dto.diaryDefaultVisibility,
        allowFollowRequests: dto.allowFollowRequests,
        showOnlineStatus: dto.showOnlineStatus,
        allowDirectMessages: dto.allowDirectMessages,
        showInRecommendations: dto.showInRecommendations,
      },
      create: {
        userId,
        profileVisibility: dto.profileVisibility || 'FRIENDS',
        mbtiVisibility: dto.mbtiVisibility || 'FRIENDS',
        locationVisibility: dto.locationVisibility || 'FRIENDS',
        birthDateVisibility: dto.birthDateVisibility || 'PRIVATE',
        interestsVisibility: dto.interestsVisibility || 'FRIENDS',
        lifestyleVisibility: dto.lifestyleVisibility || 'FRIENDS',
        diaryDefaultVisibility: dto.diaryDefaultVisibility || 'PRIVATE',
        allowFollowRequests: dto.allowFollowRequests ?? true,
        showOnlineStatus: dto.showOnlineStatus ?? true,
        allowDirectMessages: dto.allowDirectMessages ?? true,
        showInRecommendations: dto.showInRecommendations ?? true,
      },
    });

    return {
      success: true,
      message: '상세 프라이버시 설정이 업데이트되었습니다.',
    };
  }

  async blockUser(req: any, dto: BlockUserDto): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    const { targetUserId } = dto;

    if (userId === targetUserId) {
      throw new Error('자기 자신을 차단할 수 없습니다.');
    }

    // 이미 차단된 사용자인지 확인
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
    });

    if (existingBlock) {
      throw new Error('이미 차단된 사용자입니다.');
    }

    // 차단 관계 생성
    await this.prisma.userBlock.create({
      data: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    });

    // 기존 친구 관계가 있다면 제거
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: userId },
        ],
      },
    });

    return {
      success: true,
      message: '사용자를 차단했습니다.',
    };
  }

  async unblockUser(req: any, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;

    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('차단 관계를 찾을 수 없습니다.');
    }

    await this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
    });

    return {
      success: true,
      message: '사용자 차단을 해제했습니다.',
    };
  }

  async getBlockedUsers(req: any): Promise<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }> {
    const userId = req.user.userId;

    const blockedUsers = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      blockedUsers: blockedUsers.map(block => ({
        id: block.blocked.id,
        username: block.blocked.username,
        profileImageUrl: block.blocked.profileImageUrl || undefined,
      })),
    };
  }

  async checkProfileVisibility(req: any, username: string): Promise<{ canView: boolean; visibleFields: string[] }> {
    const currentUserId = req.user.userId;
    
    // 대상 사용자 조회
    const targetUser = await this.prisma.user.findFirst({
      where: { username },
      include: {
        privacySettings: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 본인인 경우 모든 정보 조회 가능
    if (currentUserId === targetUser.id) {
      return {
        canView: true,
        visibleFields: ['all'],
      };
    }

    // 차단된 사용자인지 확인
    const isBlocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: targetUser.id, blockedId: currentUserId },
          { blockerId: currentUserId, blockedId: targetUser.id },
        ],
      },
    });

    if (isBlocked) {
      return {
        canView: false,
        visibleFields: [],
      };
    }

    // 친구 관계 확인
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: targetUser.id, status: 'accepted' },
          { requesterId: targetUser.id, addresseeId: currentUserId, status: 'accepted' },
        ],
      },
    });

    const isFriend = !!friendship;
    const privacySettings = targetUser.privacySettings;
    
    if (!privacySettings) {
      // 기본 설정: 친구들에게만 공개
      return {
        canView: isFriend,
        visibleFields: isFriend ? ['basic', 'mbti', 'location', 'interests'] : ['basic'],
      };
    }

    const visibleFields: string[] = [];

    // 각 필드별 공개 범위 확인
    const checkVisibility = (visibility: string): boolean => {
      switch (visibility) {
        case 'PUBLIC':
          return true;
        case 'FRIENDS':
          return isFriend;
        case 'PRIVATE':
          return false;
        default:
          return false;
      }
    };

    if (checkVisibility(privacySettings.profileVisibility)) {
      visibleFields.push('basic');
    }
    if (checkVisibility(privacySettings.mbtiVisibility)) {
      visibleFields.push('mbti');
    }
    if (checkVisibility(privacySettings.locationVisibility)) {
      visibleFields.push('location');
    }
    if (checkVisibility(privacySettings.birthDateVisibility)) {
      visibleFields.push('birthDate');
    }
    if (checkVisibility(privacySettings.interestsVisibility)) {
      visibleFields.push('interests');
    }
    if (checkVisibility(privacySettings.lifestyleVisibility)) {
      visibleFields.push('lifestyle');
    }

    return {
      canView: visibleFields.length > 0,
      visibleFields,
    };
  }
}

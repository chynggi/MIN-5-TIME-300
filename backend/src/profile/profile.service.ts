import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto, UpdateProfileImageDto, UpdatePrivacyDto, UpdateLifestyleDto, ProfileCompleteDto } from './dto/update-profile-extended.dto';
import { DetailedPrivacyDto, BlockUserDto, UnblockUserDto, PrivacySettingsResponseDto, VisibilityLevel } from './dto/privacy-settings.dto';
import { ProfileResponseDto, OtherProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import { ProfileEditDataDto, ProfileBasicInfoDto, InterestInfoDto, LifestyleInfoDto, InterestOptionsDto, LifestyleOptionsDto } from './dto/profile-edit-data.dto';
import { PrismaService } from '../prisma.service';
import { PersonaService } from './persona.service';
import { StatisticsService } from '../statistics/statistics.service';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personaService: PersonaService,
    private readonly statisticsService: StatisticsService,
    private readonly fileUploadService: FileUploadService,
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
      bio: user.bio ?? '',
      birthDate: user.birthDate ?? '',
      location: user.location ?? '',
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
    const otherUser = await this.prisma.user.findFirst({ 
      where: { username: otherUsername },
      include: {
        privacySettings: true,
      },
    });
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

    // 달력 조회 권한 계산
    let canViewCalendar = false;
    
    // 본인인 경우 모든 권한
    if (currentUserId === otherUserId) {
      canViewCalendar = true;
    } else {
      // 차단된 사용자인지 확인
      const isBlocked = await this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: otherUserId, blockedId: currentUserId },
            { blockerId: currentUserId, blockedId: otherUserId },
          ],
        },
      });

      if (!isBlocked) {
        // 친구 관계 확인
        const friendship = await this.prisma.friend.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, addresseeId: otherUserId, status: 'accepted' },
              { requesterId: otherUserId, addresseeId: currentUserId, status: 'accepted' },
            ],
          },
        });

        const isFriend = !!friendship;

        // 일기 공개 설정 확인
        // 먼저 공개된 개별 일기가 있는지 확인
        const hasPublicJournals = await this.prisma.journal.count({
          where: { 
            userId: otherUserId, 
            isPublic: true 
          }
        }) > 0;
        
        // 개별 일기가 공개되어 있으면 누구나 볼 수 있음
        if (hasPublicJournals) {
          canViewCalendar = true;
        }
        // 그렇지 않으면 사용자 전체 설정 확인
        else {
          if (otherUser.showDiariesToPublic) {
            canViewCalendar = true;
          } else if (otherUser.showDiariesToFriends && isFriend) {
            canViewCalendar = true;
          }
        }

        // PrivacySettings 테이블의 설정도 확인 (더 세부적인 설정이 있는 경우)
        if (otherUser.privacySettings) {
          const { diaryDefaultVisibility } = otherUser.privacySettings;
          
          switch (diaryDefaultVisibility) {
            case 'PUBLIC':
              canViewCalendar = true;
              break;
            case 'FRIENDS':
              canViewCalendar = isFriend;
              break;
            case 'PRIVATE':
              canViewCalendar = false;
              break;
            default:
              // 기본값은 위에서 설정한 값 유지
              break;
          }
        }
      }
    }

    return {
      id: otherUser.id,
      username: otherUser.username,
      bio: otherUser.bio || undefined,
      diaryCount,
      followerCount,
      followingCount,
      lpgScore: lpgData.lpgScore,
      isFollowing,
      isPublic: true,
      mbti: otherUser.mbti || '',
      canViewCalendar,
    };
  }

  /**
   * 다른 사용자의 일기 달력 데이터 조회 (공개 설정에 따라 필터링)
   */
  async getOtherUserCalendarData(req: any, otherUsername: string, year: number, month: number) {
    const currentUserId = req.user.userId;
    
    // 대상 사용자 조회
    const otherUser = await this.prisma.user.findFirst({ 
      where: { username: otherUsername },
      include: {
        privacySettings: true,
      },
    });
    
    if (!otherUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const otherUserId = otherUser.id;

    // 본인인 경우 모든 일기 반환
    if (currentUserId === otherUserId) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const journals = await this.prisma.journal.findMany({
        where: {
          userId: otherUserId,
          diaryDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          diaryDate: true,
          emotion: true,
          emotionScore: true,
          isPublic: true,
        },
        orderBy: { diaryDate: 'asc' },
      });

      return {
        canViewCalendar: true,
        journals: journals.map(journal => ({
          id: journal.id,
          date: journal.diaryDate.toISOString().split('T')[0],
          emotion: journal.emotion,
          emotionScore: journal.emotionScore,
          isPublic: journal.isPublic,
        })),
      };
    }

    // 차단된 사용자인지 확인
    const isBlocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: otherUserId, blockedId: currentUserId },
          { blockerId: currentUserId, blockedId: otherUserId },
        ],
      },
    });

    if (isBlocked) {
      return {
        canViewCalendar: false,
        journals: [],
      };
    }

    // 친구 관계 확인
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, addresseeId: otherUserId, status: 'accepted' },
          { requesterId: otherUserId, addresseeId: currentUserId, status: 'accepted' },
        ],
      },
    });

    const isFriend = !!friendship;

    // 일기 공개 설정 확인
    let canViewDiaries = false;
    
    // 먼저 공개된 개별 일기가 있는지 확인
    const hasPublicJournals = await this.prisma.journal.count({
      where: { 
        userId: otherUserId, 
        isPublic: true 
      }
    }) > 0;
    
    // 개별 일기가 공개되어 있으면 누구나 볼 수 있음
    if (hasPublicJournals) {
      canViewDiaries = true;
    }
    // 그렇지 않으면 사용자 전체 설정 확인
    else {
      // 기본 User 테이블의 설정 확인
      if (otherUser.showDiariesToPublic) {
        canViewDiaries = true;
      } else if (otherUser.showDiariesToFriends && isFriend) {
        canViewDiaries = true;
      }
    }

    // PrivacySettings 테이블의 설정도 확인 (더 세부적인 설정이 있는 경우)
    if (otherUser.privacySettings) {
      const { diaryDefaultVisibility } = otherUser.privacySettings;
      
      switch (diaryDefaultVisibility) {
        case 'PUBLIC':
          canViewDiaries = true;
          break;
        case 'FRIENDS':
          canViewDiaries = isFriend;
          break;
        case 'PRIVATE':
          canViewDiaries = false;
          break;
        default:
          // 기본값은 위에서 설정한 값 유지
          break;
      }
    }

    if (!canViewDiaries) {
      return {
        canViewCalendar: false,
        journals: [],
      };
    }

    // 달력 데이터 조회
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // 일기 조회 조건 설정
    let journalWhereCondition: any = {
      userId: otherUserId,
      diaryDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 조회 권한에 따른 필터링
    if (isFriend) {
      // 친구인 경우: 전체 공개 설정이거나 친구 공개 설정인 경우 모든 일기, 아니면 공개 일기만
      if (!otherUser.showDiariesToPublic && !otherUser.showDiariesToFriends) {
        journalWhereCondition.isPublic = true;
      }
      // showDiariesToFriends가 true이면 친구는 모든 일기(공개/비공개) 볼 수 있음
    } else {
      // 친구가 아닌 경우: 전체 공개 설정이거나 개별적으로 공개된 일기만
      if (!otherUser.showDiariesToPublic) {
        journalWhereCondition.isPublic = true;
      }
      // showDiariesToPublic이 true이면 누구나 모든 일기 볼 수 있음
    }

    const journals = await this.prisma.journal.findMany({
      where: journalWhereCondition,
      select: {
        id: true,
        diaryDate: true,
        emotion: true,
        emotionScore: true,
        isPublic: true,
      },
      orderBy: { diaryDate: 'asc' },
    });

    return {
      canViewCalendar: true,
      journals: journals.map(journal => ({
        id: journal.id,
        date: journal.diaryDate.toISOString().split('T')[0],
        emotion: journal.emotion,
        emotionScore: journal.emotionScore,
        isPublic: journal.isPublic,
      })),
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

  async uploadProfileImage(req: any, file: any): Promise<{ success: boolean; profileImageUrl: string; message: string }> {
    const userId = req.user.userId;

    try {
      // 기존 프로필 이미지가 있다면 삭제
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profileImageUrl: true },
      });

      if (user?.profileImageUrl) {
        await this.fileUploadService.deleteFile(user.profileImageUrl);
      }

      // 새 프로필 이미지 업로드
      const config = this.fileUploadService.getUploadConfig('profile');
      const uploadResult = await this.fileUploadService.uploadFile(
        file,
        config.uploadPath,
        config.allowedTypes,
        config.maxSize
      );

      // 데이터베이스 업데이트
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: uploadResult.fileUrl,
        },
      });

      return {
        success: true,
        profileImageUrl: uploadResult.fileUrl,
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
      };
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
    }
  }

  async deleteProfileImage(req: any): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;

    try {
      // 현재 프로필 이미지 URL 조회
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profileImageUrl: true },
      });

      if (user?.profileImageUrl) {
        // 파일 시스템에서 이미지 파일 삭제
        await this.fileUploadService.deleteFile(user.profileImageUrl);
      }

      // 데이터베이스에서 프로필 이미지 URL 제거
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: null,
        },
      });

      return {
        success: true,
        message: '프로필 이미지가 삭제되었습니다.',
      };
    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      throw new BadRequestException('프로필 이미지 삭제 중 오류가 발생했습니다.');
    }
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

  // === 프로필 편집을 위한 데이터 조회 메서드들 ===

  /**
   * 프로필 편집을 위한 기본 정보 조회
   */
  async getProfileBasicInfo(req: any): Promise<ProfileBasicInfoDto> {
    const userId = req.user.userId;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        bio: true,
        mbti: true,
        location: true,
        birthDate: true,
        profileImageUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      username: user.username,
      bio: user.bio ?? undefined,
      mbti: user.mbti ?? undefined,
      location: user.location ?? undefined,
      birthDate: user.birthDate ?? undefined,
      profileImageUrl: user.profileImageUrl ?? undefined,
    };
  }

  /**
   * 관심사 편집을 위한 데이터 조회 (선택 가능한 옵션들 + 현재 선택된 항목들)
   */
  async getInterestEditData(req: any): Promise<InterestOptionsDto> {
    const userId = req.user.userId;
    
    // 현재 사용자가 선택한 관심사들 조회
    const userInterests = await this.prisma.userInterest.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });

    // 선택 가능한 관심사 옵션들 (프론트엔드와 동일한 목록)
    const availableInterests = [
      '독서', '영화감상', '음악', '게임', '운동', '요리', '여행', '사진촬영',
      '그림그리기', '글쓰기', '외국어학습', '코딩', '디자인', '패션', '뷰티',
      '반려동물', '원예', '악기연주', '댄스', '보드게임', '카페투어', '맛집탐방',
      '등산', '캠핑', '낚시', '자전거', '요가', '헬스', '수영', '테니스',
      '골프', '축구', '농구', '야구', '볼링', '당구', '스키', '서핑'
    ];

    return {
      availableInterests,
      selectedInterests: userInterests.map(interest => ({
        id: interest.id,
        interest: interest.interest,
        priority: interest.priority,
      })),
    };
  }

  /**
   * 라이프스타일 편집을 위한 데이터 조회 (선택 가능한 옵션들 + 현재 선택된 항목들)
   */
  async getLifestyleEditData(req: any): Promise<LifestyleOptionsDto> {
    const userId = req.user.userId;
    
    // 현재 사용자의 라이프스타일 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        workStyle: true,
        exerciseFrequency: true,
        sleepPattern: true,
        socialActivity: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 선택 가능한 옵션들 (프론트엔드와 동일한 목록)
    const workStyleOptions = [
      '재택근무', '사무실 근무', '하이브리드', '프리랜서', '학생', '기타'
    ];

    const exerciseFrequencyOptions = [
      '매일', '주 3-4회', '주 1-2회', '월 1-2회', '거의 안함'
    ];

    const sleepPatternOptions = [
      '일찍 자고 일찍 일어남', '늦게 자고 늦게 일어남', '불규칙함', '정해진 시간에 잠'
    ];

    const socialActivityOptions = [
      '매우 활동적', '보통', '조용함', '집에 있는 것을 선호'
    ];

    return {
      workStyleOptions,
      exerciseFrequencyOptions,
      sleepPatternOptions,
      socialActivityOptions,
      currentSelections: {
        workStyle: user.workStyle || undefined,
        exerciseFrequency: user.exerciseFrequency || undefined,
        sleepPattern: user.sleepPattern || undefined,
        socialActivity: user.socialActivity || undefined,
      },
    };
  }

  /**
   * 프로필 편집을 위한 모든 데이터를 한 번에 조회
   */
  async getProfileEditData(req: any): Promise<ProfileEditDataDto> {
    const userId = req.user.userId;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      basicInfo: {
        username: user.username,
        bio: user.bio || undefined,
        mbti: user.mbti || undefined,
        location: user.location || undefined,
        birthDate: user.birthDate || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      },
      interests: user.interests.map(interest => ({
        id: interest.id,
        interest: interest.interest,
        priority: interest.priority,
      })),
      lifestyle: {
        workStyle: user.workStyle || undefined,
        exerciseFrequency: user.exerciseFrequency || undefined,
        sleepPattern: user.sleepPattern || undefined,
        socialActivity: user.socialActivity || undefined,
      },
      privacySettings: {
        isProfilePublic: user.isProfilePublic,
        showMbti: user.showMbti,
        showLocation: user.showLocation,
        showBirthDate: user.showBirthDate,
        allowFollowRequests: user.allowFollowRequests,
        showDiariesToFriends: user.showDiariesToFriends,
        showDiariesToPublic: user.showDiariesToPublic,
      },
    };
  }
}

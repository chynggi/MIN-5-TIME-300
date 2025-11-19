import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UpdateBasicInfoDto,
  UpdateProfileImageDto,
  UpdatePrivacyDto,
  UpdateLifestyleDto,
  ProfileCompleteDto,
} from './dto/update-profile-extended.dto';
import {
  DetailedPrivacyDto,
  BlockUserDto,
  UnblockUserDto,
  PrivacySettingsResponseDto,
  VisibilityLevel,
  ActivitySettingsResponseDto,
  UpdateActivitySettingsDto,
} from './dto/privacy-settings.dto';
import {
  ProfileResponseDto,
  OtherProfileResponseDto,
} from './dto/profile-response.dto';
import {
  UpdateInterestsDto,
  InterestResponseDto,
} from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import {
  ProfileEditDataDto,
  ProfileBasicInfoDto,
  InterestInfoDto,
  LifestyleInfoDto,
  InterestOptionsDto,
  LifestyleOptionsDto,
} from './dto/profile-edit-data.dto';
import { PrismaService } from '../prisma.service';
import { PersonaService } from './persona.service';
import { StatisticsService } from '../statistics/statistics.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { BaseService } from '../common/logger/base.service';

@Injectable()
export class ProfileService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personaService: PersonaService,
    private readonly statisticsService: StatisticsService,
    private readonly fileUploadService: FileUploadService,
  ) {
    super(ProfileService.name);
  }

  async getProfile(req: any): Promise<ProfileResponseDto> {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        mbti: true,
        bio: true,
        birthDate: true,
        location: true,
        profileImageUrl: true,
        createdAt: true,
        interests: true,
        activityPublic: true,
        activityScore: true,
        activityLevel: true,
        streakDays: true,
        badges: { select: { type: true, awardedAt: true } },
      },
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const [mentalIndex, activityKpis] = await Promise.all([
      this.calculateMentalIndex(userId),
      this.calculateActivityKpis(userId),
    ]);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      mbti: user.mbti ?? '',
      bio: user.bio ?? '',
      birthDate: user.birthDate ?? '',
      location: user.location ?? '',
      profileImageUrl: user.profileImageUrl || '',
      interests: user.interests.map((i) => ({
        id: i.id,
        interest: i.interest,
        priority: i.priority,
      })),
      createdAt: user.createdAt.toISOString(),
      activityScore: user.activityScore ?? 0,
      // 확장 지표 추가
      // @ts-ignore - DTO 확장에 맞춰 프론트 타입도 업데이트 필요
      mentalIndex,
      // @ts-ignore
      activityKpis,
      activityPublic: user.activityPublic,
      // streak/badges 노출
      // @ts-ignore
      streakDays: user.streakDays,
      // @ts-ignore
      badges: (user.badges || []).map((b) => ({
        type: b.type,
        awardedAt: b.awardedAt.toISOString(),
      })),
    };
  }
  /**
   * 타인 프로필 조회
   */
  async getOtherProfile(
    req: any,
    otherUsername: string,
  ): Promise<OtherProfileResponseDto> {
    const currentUserId = req.user.userId;
    // username 기반 조회
    const otherUser = await this.prisma.user.findFirst({
      where: { username: otherUsername },
      select: {
        id: true,
        username: true,
        bio: true,
        mbti: true,
        showDiariesToPublic: true,
        showDiariesToFriends: true,
        privacySettings: true,
        activityPublic: true,
        activityScore: true,
        isProfilePublic: true,
        streakDays: true,
        badges: { select: { type: true, awardedAt: true } },
      },
    });
    if (!otherUser) throw new NotFoundException('유저를 찾을 수 없습니다.');
    const otherUserId = otherUser.id;

    // 공개 일기 수 (공개 일기만 카운트)
    const diaryCount = await this.prisma.journal.count({
      where: { userId: otherUserId, isPublic: true },
    });

    // FollowCounters 활용 (없으면 즉시 생성 X, 0 처리)
    const followCounters = await this.prisma.followCounters.findUnique({
      where: { userId: otherUserId },
    });
    const followerCount = followCounters?.followersCount ?? 0;
    const followingCount = followCounters?.followingCount ?? 0;

    // 현재 사용자 팔로우 상태(Follow 테이블 기준)
    const followRelation = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: currentUserId,
          followeeId: otherUserId,
        },
      },
    });
    const isFollowing = !!(
      followRelation &&
      followRelation.deletedAt === null &&
      followRelation.status === 'ACTIVE'
    );

    // LPG 점수 조회 (StatisticsService 이용)
    const lpgData = await this.statisticsService.getLPGScore({
      user: { userId: otherUserId },
    });

    // 프로필 visibility 우선 Quick Fix: profileVisibility=PRIVATE && 친구 아님 => 최소 응답
    let profileVisibility: string | undefined =
      otherUser.privacySettings?.profileVisibility;
    // 기본: isProfilePublic true이면 PUBLIC 취급, false이면 FRIENDS 취급 (간단 맵핑)
    if (!profileVisibility) {
      profileVisibility = otherUser.isProfilePublic ? 'PUBLIC' : 'FRIENDS';
    }

    // 친구 관계(Follow ACTIVE 상호 여부)를 아직 계산하지 않았으므로 간단히 isFollowing 역방향도 검사
    const reverseRelation = await this.prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: otherUserId,
          followeeId: currentUserId,
        },
      },
    });
    const otherFollowsMe = !!(
      reverseRelation &&
      reverseRelation.deletedAt === null &&
      reverseRelation.status === 'ACTIVE'
    );
    const isFriendLike = isFollowing && otherFollowsMe; // 상호 팔로우를 친구로 간주 (Quick Fix)

    if (
      profileVisibility === 'PRIVATE' &&
      currentUserId !== otherUserId &&
      !isFriendLike
    ) {
      return {
        id: otherUser.id,
        username: otherUser.username,
        diaryCount: 0,
        followerCount: 0,
        followingCount: 0,
        lpgScore: 0,
        isFollowing,
        isPublic: false,
        mbti: '',
        canViewCalendar: false,
        activityScore: undefined,
        activityPublic: otherUser.activityPublic,
      };
    }

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
              {
                requesterId: currentUserId,
                addresseeId: otherUserId,
                status: 'accepted',
              },
              {
                requesterId: otherUserId,
                addresseeId: currentUserId,
                status: 'accepted',
              },
            ],
          },
        });

        const isFriend = !!friendship;

        // 일기 공개 설정 확인
        // 먼저 공개된 개별 일기가 있는지 확인
        const hasPublicJournals =
          (await this.prisma.journal.count({
            where: {
              userId: otherUserId,
              isPublic: true,
            },
          })) > 0;

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

    const otherMentalIndex = await this.calculateMentalIndex(otherUserId);

    // activityPublic 반영: 비공개면 다른 사용자에게 activityScore 숨김
    let activityScore: number | undefined = undefined;
    if (otherUser.activityPublic || currentUserId === otherUserId) {
      activityScore = otherUser.activityScore ?? 0;
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
      isPublic: profileVisibility === 'PUBLIC',
      mbti: otherUser.mbti || '',
      canViewCalendar,
      activityScore,
      // @ts-ignore
      mentalIndex: otherMentalIndex,
      activityPublic: otherUser.activityPublic,
      // @ts-ignore
      streakDays: (otherUser as any).streakDays,
      // @ts-ignore
      badges: ((otherUser as any).badges || []).map((b: any) => ({
        type: b.type,
        awardedAt: b.awardedAt.toISOString(),
      })),
    };
  }

  /**
   * 다른 사용자의 일기 달력 데이터 조회 (공개 설정에 따라 필터링)
   */
  async getOtherUserCalendarData(
    req: any,
    otherUsername: string,
    year: number,
    month: number,
  ) {
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
        journals: journals.map((journal) => ({
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
          {
            requesterId: currentUserId,
            addresseeId: otherUserId,
            status: 'accepted',
          },
          {
            requesterId: otherUserId,
            addresseeId: currentUserId,
            status: 'accepted',
          },
        ],
      },
    });

    const isFriend = !!friendship;

    // 일기 공개 설정 확인
    let canViewDiaries = false;

    // 먼저 공개된 개별 일기가 있는지 확인
    const hasPublicJournals =
      (await this.prisma.journal.count({
        where: {
          userId: otherUserId,
          isPublic: true,
        },
      })) > 0;

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
    const journalWhereCondition: any = {
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
      journals: journals.map((journal) => ({
        id: journal.id,
        date: journal.diaryDate.toISOString().split('T')[0],
        emotion: journal.emotion,
        emotionScore: journal.emotionScore,
        isPublic: journal.isPublic,
      })),
    };
  }

  async updateProfile(
    req: any,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const userId = req.user.userId;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        mbti: dto.mbti,
        profileImageUrl: dto.profileImageUrl,
      },
      select: {
        id: true,
        email: true,
        username: true,
        mbti: true,
        profileImageUrl: true,
        createdAt: true,
        activityPublic: true,
        activityScore: true,
        interests: true,
      },
    });
    // 프로필 변경 시 페르소나/목표 자동 추출 및 DB 저장
    try {
      const personaAndGoals =
        await this.personaService.generatePersonaAndGoals(userId);
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
      this.logger.warn(
        `페르소나 생성 실패(프로필 업데이트) user=${userId} err=${(e as Error)?.message}`,
      );
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      mbti: user.mbti ?? '',
      profileImageUrl: user.profileImageUrl || '',
      interests: user.interests.map((i) => ({
        id: i.id,
        interest: i.interest,
        priority: i.priority,
      })),
      createdAt: user.createdAt.toISOString(),
      activityScore: user.activityScore ?? 0,
      activityPublic: user.activityPublic,
    };
  }

  async updateInterests(
    req: any,
    dto: UpdateInterestsDto,
  ): Promise<{ success: boolean; interests: InterestResponseDto[] }> {
    const userId = req.user.userId;
    // 기존 관심사 삭제 후 새로 추가 (간단 구현)
    await this.prisma.userInterest.deleteMany({ where: { userId } });
    const created = await this.prisma.userInterest.createMany({
      data: dto.interests.map((i) => ({ ...i, userId })),
      skipDuplicates: true,
    });
    const interests = await this.prisma.userInterest.findMany({
      where: { userId },
    });
    // 관심사 변경 시 페르소나/목표 자동 추출 및 DB 저장
    try {
      const personaAndGoals =
        await this.personaService.generatePersonaAndGoals(userId);
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
      this.logger.warn(
        `페르소나 생성 실패(관심사 업데이트) user=${userId} err=${(e as Error)?.message}`,
      );
    }
    return {
      success: true,
      interests: interests.map((i) => ({
        id: i.id,
        interest: i.interest,
        priority: i.priority,
      })),
    };
  }

  async answerLifestyle(
    req: any,
    dto: LifestyleAnswerDto,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;
    // 기존 답변 삭제 후 새로 추가 (간단 구현)
    await this.prisma.lifestyleAnswer.deleteMany({ where: { userId } });
    await this.prisma.lifestyleAnswer.createMany({
      data: dto.answers.map((a) => ({ ...a, userId })),
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
  async getPersonaAndGoals(
    userId: string,
  ): Promise<{ persona: string; goals: string[] }> {
    const cached = await this.prisma.userPersona.findUnique({
      where: { userId },
    });
    if (cached) {
      return {
        persona: cached.persona,
        goals: JSON.parse(cached.goals || '[]'),
      };
    }
    // 없으면 AI로 생성 후 저장
    const personaAndGoals =
      await this.personaService.generatePersonaAndGoals(userId);
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
  async updateBasicInfo(
    req: any,
    dto: UpdateBasicInfoDto,
  ): Promise<{ success: boolean; message: string }> {
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

  async updateProfileImage(
    req: any,
    dto: UpdateProfileImageDto,
  ): Promise<{ success: boolean; message: string }> {
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

  async uploadProfileImage(
    req: any,
    file: any,
  ): Promise<{ success: boolean; profileImageUrl: string; message: string }> {
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
        config.maxSize,
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
      this.logger.error(
        `프로필 이미지 업로드 오류 user=${userId} err=${(error as Error)?.message}`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
    }
  }

  async deleteProfileImage(
    req: any,
  ): Promise<{ success: boolean; message: string }> {
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
      this.logger.error(
        `프로필 이미지 삭제 오류 user=${userId} err=${(error as Error)?.message}`,
      );
      throw new BadRequestException(
        '프로필 이미지 삭제 중 오류가 발생했습니다.',
      );
    }
  }

  async updatePrivacy(
    req: any,
    dto: UpdatePrivacyDto,
  ): Promise<{ success: boolean; message: string }> {
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

  async updateLifestyle(
    req: any,
    dto: UpdateLifestyleDto,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.userId;

    const hasAnswerPayload = Array.isArray(dto.answers) && dto.answers.length > 0;
    const hasStructuredFields =
      dto.workStyle !== undefined ||
      dto.exerciseFrequency !== undefined ||
      dto.sleepPattern !== undefined ||
      dto.socialActivity !== undefined;

    if (hasAnswerPayload) {
      await this.prisma.lifestyleAnswer.deleteMany({ where: { userId } });
      await this.prisma.lifestyleAnswer.createMany({
        data: dto.answers!.map((answer) => ({ ...answer, userId })),
        skipDuplicates: true,
      });
    }

    if (hasStructuredFields) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          workStyle: dto.workStyle,
          exerciseFrequency: dto.exerciseFrequency,
          sleepPattern: dto.sleepPattern,
          socialActivity: dto.socialActivity,
        },
      });
    }

    if (!hasAnswerPayload && !hasStructuredFields) {
      return {
        success: true,
        message: '변경된 라이프스타일 데이터가 없어 기존 정보를 유지했습니다.',
      };
    }

    return {
      success: true,
      message: '라이프스타일 정보가 업데이트되었습니다.',
    };
  }

  async updateCompleteProfile(
    req: any,
    dto: ProfileCompleteDto,
  ): Promise<{ success: boolean; message: string }> {
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
      const personaAndGoals =
        await this.personaService.generatePersonaAndGoals(userId);
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
      this.logger.error(
        `페르소나 생성 오류 user=${userId} err=${(e as Error)?.message}`,
      );
    }

    return {
      success: true,
      message: '프로필이 완전히 업데이트되었습니다.',
    };
  }

  /**
   * 최근 30일 멘탈지수(0-100)
   * - 체크인 기반 정규화 점수의 가중 평균
   * - 없으면 베이스라인 또는 기본값 50
   */
  private async calculateMentalIndex(userId: string): Promise<number> {
    const today = new Date();
    const since = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    since.setDate(since.getDate() - 29); // 오늘 포함 30일 창

    const [checks, baseline] = await Promise.all([
      this.prisma.dailyCheckin.findMany({
        where: { userId, diaryDate: { gte: since, lte: today } },
        orderBy: { diaryDate: 'asc' },
      }),
      this.prisma.userBaselineCheckin.findUnique({ where: { userId } }),
    ]);

    const norm = (x: number) => (x - 1) / 9; // 1~10 -> 0~1
    const hoursBucket = (h: number) => {
      if (h <= 4) return 0.2;
      if (h <= 6) return 0.6;
      return 1.0; // 7~9+
    };
    const sleepScore = (hours1to9p?: number, quality1to10?: number) => {
      if (!hours1to9p || !quality1to10) return undefined;
      return 0.6 * hoursBucket(hours1to9p) + 0.4 * norm(quality1to10);
    };

    // 개별 일자 점수 계산
    const dayScores: number[] = [];
    for (const c of checks) {
      const mood = c.mood_1to10 ? norm(c.mood_1to10) : undefined;
      const stressInv = c.stress_1to10 ? 1 - norm(c.stress_1to10) : undefined;
      const energy = c.energy_1to10 ? norm(c.energy_1to10) : undefined;
      const sleep = sleepScore(
        c.sleep_hours_1to9p as any,
        c.sleep_quality_1to10 as any,
      );
      const vitality =
        energy !== undefined && sleep !== undefined
          ? 0.5 * energy + 0.5 * sleep
          : (energy ?? sleep);
      const focus = c.focus_1to10 ? norm(c.focus_1to10) : undefined;
      const fatigueInv = c.fatigue_1to10
        ? 1 - norm(c.fatigue_1to10)
        : undefined;
      const socialSat = c.social_satisfaction_1to10
        ? norm(c.social_satisfaction_1to10)
        : undefined;

      const parts: Array<[number, number]> = [];
      if (mood !== undefined) parts.push([mood, 0.25]);
      if (stressInv !== undefined) parts.push([stressInv, 0.2]);
      if (vitality !== undefined) parts.push([vitality, 0.2]);
      if (focus !== undefined) parts.push([focus, 0.15]);
      if (fatigueInv !== undefined) parts.push([fatigueInv, 0.1]);
      if (socialSat !== undefined) parts.push([socialSat, 0.1]);
      if (!parts.length) continue;
      const wsum = parts.reduce((a, [_, w]) => a + w, 0);
      const score01 = parts.reduce((a, [v, w]) => a + v * (w / wsum), 0);
      dayScores.push(score01);
    }

    let avg01: number;
    if (dayScores.length) {
      avg01 = dayScores.reduce((a, b) => a + b, 0) / dayScores.length;
    } else if (baseline) {
      // 베이스라인만 있는 경우 간이 계산
      const bMood = norm(baseline.mood_1to10);
      const bStressInv = 1 - norm(baseline.stress_1to10);
      const bEnergy = norm(baseline.energy_1to10);
      const bSleep =
        sleepScore(
          baseline.sleep_hours_1to9p as any,
          baseline.sleep_quality_1to10 as any,
        ) ?? 0.5;
      avg01 =
        0.25 * bMood +
        0.2 * bStressInv +
        0.2 * (0.5 * bEnergy + 0.5 * bSleep) +
        0.35 * 0.5; // 나머지 항목 평균치
    } else {
      // 데이터 없으면 중립 0.5
      avg01 = 0.5;
    }
    return Math.round(Math.max(0, Math.min(100, avg01 * 100)));
  }

  /**
   * 최근 30일 활동 KPI
   * - clickRate: 조언 상호작용(피드백) / 조언 수
   * - diaryContinuationRate: 30일 중 작성한 날 비율
   * - nextDayRevisitRate: 작성일 다음날에도 작성한 비율
   */
  private async calculateActivityKpis(userId: string): Promise<{
    clickRate: number;
    diaryContinuationRate: number;
    nextDayRevisitRate: number;
  }> {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    start.setDate(start.getDate() - 29); // 30일 창

    const [adviceCount, feedbackCount, diaries] = await Promise.all([
      this.prisma.advice.count({
        where: { userId, createdAt: { gte: start, lte: today } },
      }),
      this.prisma.adviceFeedback.count({
        where: { userId, createdAt: { gte: start, lte: today } },
      }),
      this.prisma.journal.findMany({
        where: { userId, diaryDate: { gte: start, lte: today } },
        select: { diaryDate: true },
        orderBy: { diaryDate: 'asc' },
      }),
    ]);

    // clickRate: 상호작용 비율(0~1)
    const clickRate =
      adviceCount > 0 ? Math.min(1, feedbackCount / adviceCount) : 0;

    // unique 작성일 세트
    const daysSet = new Set<string>();
    for (const d of diaries) {
      const key = d.diaryDate.toISOString().split('T')[0];
      daysSet.add(key);
    }
    const writtenDays = daysSet.size;
    const windowDays = 30;
    const diaryContinuationRate = windowDays > 0 ? writtenDays / windowDays : 0;

    // next-day revisit: 일기가 있는 날 중, 다음날에도 있는 날의 비율
    const datesSorted = Array.from(daysSet).sort();
    let revisitNumerator = 0;
    for (let i = 0; i < datesSorted.length; i++) {
      const cur = new Date(datesSorted[i]);
      const next = new Date(
        cur.getFullYear(),
        cur.getMonth(),
        cur.getDate() + 1,
      );
      const key = next.toISOString().split('T')[0];
      if (daysSet.has(key)) revisitNumerator += 1;
    }
    const denominator = datesSorted.length; // 작성일 수 기준
    const nextDayRevisitRate =
      denominator > 0 ? revisitNumerator / denominator : 0;

    return { clickRate, diaryContinuationRate, nextDayRevisitRate };
  }

  // === 활동지수 공개/초기화 관련 메서드 ===
  async getActivitySettings(req: any): Promise<ActivitySettingsResponseDto> {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activityPublic: true, activityResetAt: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return {
      activityPublic: user.activityPublic,
      lastResetAt: user.activityResetAt
        ? user.activityResetAt.toISOString()
        : undefined,
    };
  }

  async updateActivitySettings(
    req: any,
    dto: UpdateActivitySettingsDto,
  ): Promise<{ success: boolean; activityPublic: boolean }> {
    const userId = req.user.userId;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activityPublic: dto.activityPublic },
      select: { activityPublic: true },
    });
    return { success: true, activityPublic: updated.activityPublic };
  }

  async resetActivity(
    req: any,
  ): Promise<{ success: boolean; message: string; resetAt: string }> {
    const userId = req.user.userId;
    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { activityResetAt: now },
    });
    return {
      success: true,
      message: '활동지수가 초기화되었습니다.',
      resetAt: now.toISOString(),
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
  async getDetailedPrivacySettings(
    req: any,
  ): Promise<PrivacySettingsResponseDto> {
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
      birthDateVisibility:
        privacySettings.birthDateVisibility as VisibilityLevel,
      interestsVisibility:
        privacySettings.interestsVisibility as VisibilityLevel,
      lifestyleVisibility:
        privacySettings.lifestyleVisibility as VisibilityLevel,
      followersVisibility:
        privacySettings.followersVisibility as VisibilityLevel,
      followingVisibility:
        privacySettings.followingVisibility as VisibilityLevel,
      diaryDefaultVisibility:
        privacySettings.diaryDefaultVisibility as VisibilityLevel,
      allowFollowRequests: privacySettings.allowFollowRequests,
      showOnlineStatus: privacySettings.showOnlineStatus,
      allowDirectMessages: privacySettings.allowDirectMessages,
      showInRecommendations: privacySettings.showInRecommendations,
      blockedUsers: blockedUsers.map((block) => ({
        id: block.blocked.id,
        username: block.blocked.username,
        profileImageUrl: block.blocked.profileImageUrl || undefined,
      })),
    };
  }

  async updateDetailedPrivacy(
    req: any,
    dto: DetailedPrivacyDto,
  ): Promise<{ success: boolean; message: string }> {
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
        followersVisibility: dto.followersVisibility,
        followingVisibility: dto.followingVisibility,
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
        followersVisibility: dto.followersVisibility || 'PUBLIC',
        followingVisibility: dto.followingVisibility || 'PUBLIC',
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

  async blockUser(
    req: any,
    dto: BlockUserDto,
  ): Promise<{ success: boolean; message: string }> {
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

  async unblockUser(
    req: any,
    targetUserId: string,
  ): Promise<{ success: boolean; message: string }> {
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

  async getBlockedUsers(req: any): Promise<{
    blockedUsers: Array<{
      id: string;
      username: string;
      profileImageUrl?: string;
    }>;
  }> {
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
      blockedUsers: blockedUsers.map((block) => ({
        id: block.blocked.id,
        username: block.blocked.username,
        profileImageUrl: block.blocked.profileImageUrl || undefined,
      })),
    };
  }

  async checkProfileVisibility(
    req: any,
    username: string,
  ): Promise<{ canView: boolean; visibleFields: string[] }> {
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
          {
            requesterId: currentUserId,
            addresseeId: targetUser.id,
            status: 'accepted',
          },
          {
            requesterId: targetUser.id,
            addresseeId: currentUserId,
            status: 'accepted',
          },
        ],
      },
    });

    const isFriend = !!friendship;
    const privacySettings = targetUser.privacySettings;

    if (!privacySettings) {
      // 기본 설정: 친구들에게만 공개
      return {
        canView: isFriend,
        visibleFields: isFriend
          ? ['basic', 'mbti', 'location', 'interests']
          : ['basic'],
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
      '독서',
      '영화감상',
      '음악',
      '게임',
      '운동',
      '요리',
      '여행',
      '사진촬영',
      '그림그리기',
      '글쓰기',
      '외국어학습',
      '코딩',
      '디자인',
      '패션',
      '뷰티',
      '반려동물',
      '원예',
      '악기연주',
      '댄스',
      '보드게임',
      '카페투어',
      '맛집탐방',
      '등산',
      '캠핑',
      '낚시',
      '자전거',
      '요가',
      '헬스',
      '수영',
      '테니스',
      '골프',
      '축구',
      '농구',
      '야구',
      '볼링',
      '당구',
      '스키',
      '서핑',
    ];

    return {
      availableInterests,
      selectedInterests: userInterests.map((interest) => ({
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

    const [user, lifestyleAnswers] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          workStyle: true,
          exerciseFrequency: true,
          sleepPattern: true,
          socialActivity: true,
        },
      }),
      this.prisma.lifestyleAnswer.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const currentSelections = lifestyleAnswers.reduce<Record<string, string>>(
      (acc, entry) => {
        if (entry.question && entry.answer) {
          acc[entry.question] = entry.answer;
        }
        return acc;
      },
      {},
    );

    // 선택 가능한 옵션들 (프론트엔드와 동일한 목록)
    const workStyleOptions = [
      '재택근무',
      '사무실 근무',
      '하이브리드',
      '프리랜서',
      '학생',
      '기타',
    ];

    const exerciseFrequencyOptions = [
      '매일',
      '주 3-4회',
      '주 1-2회',
      '월 1-2회',
      '거의 안함',
    ];

    const sleepPatternOptions = [
      '일찍 자고 일찍 일어남',
      '늦게 자고 늦게 일어남',
      '불규칙함',
      '정해진 시간에 잠',
    ];

    const socialActivityOptions = [
      '매우 활동적',
      '보통',
      '조용함',
      '집에 있는 것을 선호',
    ];

    return {
      workStyleOptions,
      exerciseFrequencyOptions,
      sleepPatternOptions,
      socialActivityOptions,
      currentSelections,
      legacySelections: {
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
      interests: user.interests.map((interest) => ({
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

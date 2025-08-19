import { Body, Controller, Get, Put, Post, Delete, Req, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto, UpdateProfileImageDto, UpdatePrivacyDto, UpdateLifestyleDto, ProfileCompleteDto } from './dto/update-profile-extended.dto';
import { DetailedPrivacyDto, BlockUserDto, UnblockUserDto, PrivacySettingsResponseDto } from './dto/privacy-settings.dto';
import { ProfileResponseDto, OtherProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import { PersonaService } from './persona.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly personaService: PersonaService,
  ) {}

  @Get()
  async getProfile(@Req() req): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(req);
  }

  @Put()
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(req, dto);
  }

  @Post('interests')
  async updateInterests(@Req() req, @Body() dto: UpdateInterestsDto): Promise<{ success: boolean; interests: InterestResponseDto[] }> {
    return this.profileService.updateInterests(req, dto);
  }

  @Post('lifestyle')
  async answerLifestyle(@Req() req, @Body() dto: LifestyleAnswerDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.answerLifestyle(req, dto);
  }

  /**
   * 페르소나/목표 추출 (AI 기반)
   */
  @Post('persona')
  async generatePersona(@Req() req) {
    const userId = req.user.userId;
    return this.personaService.generatePersonaAndGoals(userId);
  }

  /**
   * 페르소나/목표 조회(캐싱, AI 자동 생성)
   */
  @Get('persona')
  async getPersona(@Req() req) {
    const userId = req.user.userId;
    return this.profileService.getPersonaAndGoals(userId);
  }
  
  /**
   * 타인 프로필 조회 (username으로 조회)
   */
  @Get(':username')
  async getOtherProfile(@Req() req, @Param('username') username: string): Promise<OtherProfileResponseDto> {
    return this.profileService.getOtherProfile(req, username);
  }

  // 프로필 편집 관련 엔드포인트 추가
  @Put('basic')
  async updateBasicInfo(@Req() req, @Body() dto: UpdateBasicInfoDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateBasicInfo(req, dto);
  }

  @Put('image')
  async updateProfileImage(@Req() req, @Body() dto: UpdateProfileImageDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateProfileImage(req, dto);
  }

  @Put('privacy')
  async updatePrivacy(@Req() req, @Body() dto: UpdatePrivacyDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updatePrivacy(req, dto);
  }

  @Put('lifestyle')
  async updateLifestyle(@Req() req, @Body() dto: UpdateLifestyleDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateLifestyle(req, dto);
  }

  @Post('complete')
  async updateCompleteProfile(@Req() req, @Body() dto: ProfileCompleteDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateCompleteProfile(req, dto);
  }

  @Get('privacy/settings')
  async getPrivacySettings(@Req() req): Promise<UpdatePrivacyDto> {
    return this.profileService.getPrivacySettings(req);
  }

  // 고급 프라이버시 설정 API들
  @Get('privacy/detailed')
  async getDetailedPrivacySettings(@Req() req): Promise<PrivacySettingsResponseDto> {
    return this.profileService.getDetailedPrivacySettings(req);
  }

  @Put('privacy/detailed')
  async updateDetailedPrivacy(@Req() req, @Body() dto: DetailedPrivacyDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateDetailedPrivacy(req, dto);
  }

  // 사용자 차단/해제 API들
  @Post('block')
  async blockUser(@Req() req, @Body() dto: BlockUserDto): Promise<{ success: boolean; message: string }> {
    return this.profileService.blockUser(req, dto);
  }

  @Delete('block/:targetUserId')
  async unblockUser(@Req() req, @Param('targetUserId') targetUserId: string): Promise<{ success: boolean; message: string }> {
    return this.profileService.unblockUser(req, targetUserId);
  }

  @Get('blocked-users')
  async getBlockedUsers(@Req() req): Promise<{ blockedUsers: Array<{ id: string; username: string; profileImageUrl?: string }> }> {
    return this.profileService.getBlockedUsers(req);
  }

  // 프로필 공개 범위 체크 API
  @Get(':username/visibility')
  async checkProfileVisibility(@Req() req, @Param('username') username: string): Promise<{ canView: boolean; visibleFields: string[] }> {
    return this.profileService.checkProfileVisibility(req, username);
  }
}

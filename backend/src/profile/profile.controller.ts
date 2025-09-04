import { Body, Controller, Get, Put, Post, Delete, Req, UseGuards, Param, UploadedFile, UseInterceptors, UseFilters } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto, UpdateProfileImageDto, UpdatePrivacyDto, UpdateLifestyleDto, ProfileCompleteDto } from './dto/update-profile-extended.dto';
import { DetailedPrivacyDto, BlockUserDto, UnblockUserDto, PrivacySettingsResponseDto, ActivitySettingsResponseDto, UpdateActivitySettingsDto } from './dto/privacy-settings.dto';
import { ProfileResponseDto, OtherProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';
import { ProfileEditDataDto, ProfileBasicInfoDto, InterestOptionsDto, LifestyleOptionsDto } from './dto/profile-edit-data.dto';
import { PersonaService } from './persona.service';
import { profileImageUploadOptions } from '../common/config/multer.config';
import { FileUploadExceptionFilter } from '../common/filters/file-upload-exception.filter';

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

  /**
   * 다른 사용자의 일기 달력 데이터 조회 (공개 설정에 따라 필터링)
   */
  @Get(':username/calendar/:year/:month')
  async getOtherUserCalendarData(
    @Req() req, 
    @Param('username') username: string,
    @Param('year') year: string,
    @Param('month') month: string
  ) {
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('올바른 년도와 월을 입력해주세요.');
    }
    
    return this.profileService.getOtherUserCalendarData(req, username, yearNum, monthNum);
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

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', profileImageUploadOptions))
  @UseFilters(FileUploadExceptionFilter)
  async uploadProfileImage(@Req() req, @UploadedFile() file: Multer.File): Promise<{ success: boolean; profileImageUrl: string; message: string }> {
    return this.profileService.uploadProfileImage(req, file);
  }

  @Delete('image')
  async deleteProfileImage(@Req() req): Promise<{ success: boolean; message: string }> {
    return this.profileService.deleteProfileImage(req);
  }

  @Get('upload-progress/:uploadId')
  async getUploadProgress(@Param('uploadId') uploadId: string): Promise<{ progress: number; status: string }> {
    // 실제 구현에서는 Redis나 메모리 캐시를 사용하여 업로드 진행 상황 추적
    // 여기서는 간단한 예시만 제공
    return {
      progress: 100,
      status: 'completed'
    };
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

  // 활동지수 설정 조회/업데이트 & 초기화
  @Get('activity/settings')
  async getActivitySettings(@Req() req): Promise<ActivitySettingsResponseDto> {
    return this.profileService.getActivitySettings(req);
  }

  @Put('activity/settings')
  async updateActivitySettings(@Req() req, @Body() dto: UpdateActivitySettingsDto): Promise<{ success: boolean; activityPublic: boolean }> {
    return this.profileService.updateActivitySettings(req, dto);
  }

  @Post('activity/reset')
  async resetActivity(@Req() req): Promise<{ success: boolean; message: string; resetAt: string }> {
    return this.profileService.resetActivity(req);
  }

  // 프로필 공개 범위 체크 API
  @Get(':username/visibility')
  async checkProfileVisibility(@Req() req, @Param('username') username: string): Promise<{ canView: boolean; visibleFields: string[] }> {
    return this.profileService.checkProfileVisibility(req, username);
  }

  // === 프로필 편집을 위한 데이터 조회 API들 ===

  /**
   * 프로필 편집을 위한 기본 정보 조회
   */
  @Get('edit/basic-info')
  async getProfileBasicInfo(@Req() req): Promise<ProfileBasicInfoDto> {
    return this.profileService.getProfileBasicInfo(req);
  }

  /**
   * 관심사 편집을 위한 데이터 조회 (선택 가능한 옵션들 + 현재 선택된 항목들)
   */
  @Get('edit/interests')
  async getInterestEditData(@Req() req): Promise<InterestOptionsDto> {
    return this.profileService.getInterestEditData(req);
  }

  /**
   * 라이프스타일 편집을 위한 데이터 조회 (선택 가능한 옵션들 + 현재 선택된 항목들)
   */
  @Get('edit/lifestyle')
  async getLifestyleEditData(@Req() req): Promise<LifestyleOptionsDto> {
    return this.profileService.getLifestyleEditData(req);
  }

  /**
   * 프로필 편집을 위한 모든 데이터를 한 번에 조회
   */
  @Get('edit/all')
  async getProfileEditData(@Req() req): Promise<ProfileEditDataDto> {
    return this.profileService.getProfileEditData(req);
  }
}

import { Body, Controller, Get, Put, Post, Req, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
}

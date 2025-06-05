import { Body, Controller, Get, Put, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateInterestsDto, InterestResponseDto } from './dto/update-interests.dto';
import { LifestyleAnswerDto } from './dto/lifestyle-answer.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
}

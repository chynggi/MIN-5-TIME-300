import { Body, Controller, Post, Req, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('logout')
  async logout(@Req() req): Promise<LogoutResponseDto> {
    // 실제 구현에서는 JWT 토큰 블랙리스트 처리 등 필요
    return this.authService.logout(req);
  }

  @Get('username/check')
  async checkUsername(
    @Query('username') username: string,
  ): Promise<{ available: boolean }> {
    return this.authService.checkUsername(username);
  }
}

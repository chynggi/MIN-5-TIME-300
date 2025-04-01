import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async googleAuth(@Req() req) {
    // Google OAuth URL로 리디렉션
    const url = this.authService.getGoogleAuthURL();
    return { url };
  }

  @Get('google/callback')
  async googleAuthCallback(@Req() req) {
    const { code } = req.query;
    return this.authService.googleAuth(code);
  }

  @Post('google')
  async authenticateGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.authenticateWithGoogle(googleAuthDto);
  }
}
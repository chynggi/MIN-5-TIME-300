import { Controller, Post, Body, Get, Req, Res, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async googleAuth(@Req() req, @Res() res: Response) {
    // Google OAuth URL로 리디렉션
    const url = this.authService.getGoogleAuthURL();
    return res.redirect(url);
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

  @Get(':service/callback')
  async serviceAuthCallback(@Param('service') service: string, @Req() req) {
    const { code } = req.query;
    return this.authService.handleServiceAuthCallback(service, code);
  }

  @Get(':service')
  async serviceAuth(@Param('service') service: string, @Req() req, @Res() res: Response) {
    const url = this.authService.getServiceAuthURL(service);
    return res.redirect(url);
  }
}
import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/v1/health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('uploads/test')
  testUploadsAccess() {
    const uploadsPath = join(process.cwd(), 'uploads');
    const profilesPath = join(uploadsPath, 'profiles');

    return {
      uploadsPath,
      profilesPath,
      uploadsExists: existsSync(uploadsPath),
      profilesExists: existsSync(profilesPath),
      files: existsSync(profilesPath)
        ? require('fs').readdirSync(profilesPath)
        : [],
    };
  }

  @Get('uploads/profiles/:filename')
  async getProfileImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), 'uploads', 'profiles', filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.sendFile(filePath);
  }
}

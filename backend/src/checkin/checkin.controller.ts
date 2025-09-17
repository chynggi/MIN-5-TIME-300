import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt') as any)
@Controller('checkin')
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCheckinDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get('today')
  async getToday(@Req() req: any) {
    return this.service.getToday(req.user.userId);
  }
}

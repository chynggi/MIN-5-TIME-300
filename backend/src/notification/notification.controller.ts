import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { NotificationSettingsDto, UpdateNotificationSettingsDto } from './dto/notification-settings.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/notification_settings')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getSettings(@Req() req): Promise<NotificationSettingsDto> {
    return this.notificationService.getSettings(req);
  }

  @Put()
  async updateSettings(@Req() req, @Body() dto: UpdateNotificationSettingsDto): Promise<{ success: boolean; settings: NotificationSettingsDto }> {
    return this.notificationService.updateSettings(req, dto);
  }
}

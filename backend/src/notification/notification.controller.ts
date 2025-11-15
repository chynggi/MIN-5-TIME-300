import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import {
  NotificationQueryDto,
  NotificationResponseDto,
  NotificationPrefsDto,
  DeviceTokenDto,
} from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 알림 목록 조회
  @Get()
  async getNotifications(
    @Req() req,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationService.getNotifications(req.user.userId, query);
  }

  // 읽지 않은 알림 개수 조회
  @Get('unread-count')
  async getUnreadCount(@Req() req): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(
      req.user.userId,
    );
    return { count };
  }

  // 특정 알림 읽음 처리
  @Patch(':id/read')
  async markAsRead(
    @Req() req,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(req.user.userId, notificationId);
  }

  // 모든 알림 읽음 처리
  @Post('read-all')
  async markAllAsRead(@Req() req): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  // 알림 숨김 처리
  @Delete(':id')
  async hideNotification(
    @Req() req,
    @Param('id') notificationId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationService.hideNotification(
      req.user.userId,
      notificationId,
    );
    return { success: true };
  }

  // 알림 설정 조회
  @Get('preferences')
  async getNotificationPrefs(@Req() req) {
    return this.notificationService.getNotificationPrefs(req.user.userId);
  }

  // 알림 설정 업데이트
  @Put('preferences')
  async updateNotificationPrefs(@Req() req, @Body() dto: NotificationPrefsDto) {
    return this.notificationService.updateNotificationPrefs(
      req.user.userId,
      dto,
    );
  }

  // 디바이스 토큰 등록
  @Post('device-tokens')
  async registerDeviceToken(@Req() req, @Body() dto: DeviceTokenDto) {
    return this.notificationService.registerDeviceToken(req.user.userId, dto);
  }
}

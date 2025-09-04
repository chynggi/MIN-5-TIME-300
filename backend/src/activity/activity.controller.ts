import { Controller, Get, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { PrismaService } from '../prisma.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly prisma: PrismaService, private readonly activityService: ActivityService) {}

  @Get()
  async getMyActivity(@Req() req: any): Promise<ActivityResponseDto> {
    const userId = req.user?.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { activityScore: true, activityLevel: true, updatedAt: true } });
    return {
      activityScore: user?.activityScore ?? 0,
      activityLevel: user?.activityLevel ?? 1,
      updatedAt: user?.updatedAt.toISOString() ?? new Date().toISOString(),
    };
  }
}

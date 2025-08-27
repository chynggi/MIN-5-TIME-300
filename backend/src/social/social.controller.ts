import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from './social.service';
import {
  SocialFriendsQueryDto,
  SocialFriendsResponseDto,
  UpdateFavoriteDto
} from './dto';

@Controller('api/v1/social')
@UseGuards(AuthGuard('jwt'))
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  /**
   * 탭별 친구 목록 조회 (통합 API)
   * GET /social/friends?tab=mutual|following|favorites&cursor=<id>&limit=20&q=<검색어>
   */
  @Get('friends')
  async getFriends(
    @Query() query: SocialFriendsQueryDto,
    @Request() req: any
  ): Promise<SocialFriendsResponseDto> {
    return this.socialService.getFriends(req.user.userId, query);
  }

  /**
   * 즐겨찾기 토글
   * PATCH /social/follow/:id/favorite
   */
  @Patch('follow/:id/favorite')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @Param('id') followId: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto,
    @Request() req: any
  ): Promise<{ success: boolean }> {
    await this.socialService.toggleFavorite(
      req.user.userId, 
      followId, 
      updateFavoriteDto.isFavorite
    );
    return { success: true };
  }
}
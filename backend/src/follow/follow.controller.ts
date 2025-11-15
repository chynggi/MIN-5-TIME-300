import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowService } from './follow.service';
import {
  FollowUserDto,
  FollowListQueryDto,
  FollowResponseDto,
  FollowListResponseDto,
  FollowCountersDto,
  BlockUserDto,
} from './dto';

@Controller('api/v1/follow')
@UseGuards(AuthGuard('jwt'))
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /**
   * 사용자를 팔로우하거나 팔로우 요청을 보냅니다.
   */
  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  async followUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ): Promise<FollowResponseDto> {
    return this.followService.followUser(req.user.userId, userId);
  }

  /**
   * 팔로우를 해제합니다.
   */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.followService.unfollowUser(req.user.userId, userId);
  }

  /**
   * 팔로우 요청을 승인합니다.
   */
  @Post(':userId/approve')
  @HttpCode(HttpStatus.OK)
  async approveFollowRequest(
    @Param('userId') followerId: string,
    @Request() req: any,
  ): Promise<FollowResponseDto> {
    return this.followService.approveFollowRequest(req.user.userId, followerId);
  }

  /**
   * 팔로우 요청을 거절합니다.
   */
  @Post(':userId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectFollowRequest(
    @Param('userId') followerId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.followService.rejectFollowRequest(req.user.userId, followerId);
  }

  /**
   * 특정 사용자의 팔로워 목록을 조회합니다.
   */
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query() query: FollowListQueryDto,
    @Request() req: any,
  ): Promise<FollowListResponseDto> {
    return this.followService.getFollowers(userId, query, req.user.userId);
  }

  /**
   * 특정 사용자의 팔로잉 목록을 조회합니다.
   */
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query() query: FollowListQueryDto,
    @Request() req: any,
  ): Promise<FollowListResponseDto> {
    return this.followService.getFollowing(userId, query, req.user.userId);
  }

  /**
   * 내가 받은 팔로우 요청 목록을 조회합니다.
   */
  @Get('requests')
  async getFollowRequests(
    @Query() query: FollowListQueryDto,
    @Request() req: any,
  ): Promise<FollowListResponseDto> {
    return this.followService.getFollowRequests(req.user.userId, query);
  }

  /**
   * 특정 사용자의 팔로우 카운터를 조회합니다.
   */
  @Get(':userId/counters')
  async getFollowCounters(
    @Param('userId') userId: string,
  ): Promise<FollowCountersDto> {
    return this.followService.getFollowCounters(userId);
  }

  /**
   * 두 사용자 간의 팔로우 관계를 확인합니다.
   */
  @Get(':userId/relationship')
  async getFollowRelationship(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.followService.getFollowRelationship(req.user.userId, userId);
  }

  /**
   * 사용자를 차단합니다.
   */
  @Post(':userId/block')
  @HttpCode(HttpStatus.CREATED)
  async blockUser(@Param('userId') userId: string, @Request() req: any) {
    return this.followService.blockUser(req.user.userId, userId);
  }

  /**
   * 사용자 차단을 해제합니다.
   */
  @Delete(':userId/block')
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Param('userId') userId: string, @Request() req: any) {
    return this.followService.unblockUser(req.user.userId, userId);
  }

  /**
   * 차단한 사용자 목록을 조회합니다.
   */
  @Get('blocked')
  async getBlockedUsers(@Request() req: any) {
    return this.followService.getBlockedUsers(req.user.userId);
  }
}

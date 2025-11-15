import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendService } from './friend.service';
import {
  FriendListResponseDto,
  FriendRequestDto,
  FriendRequestResponseDto,
  FriendRespondDto,
  FriendRespondResponseDto,
  RecommendFriendsResponseDto,
  FollowDto,
  FollowResponseDto,
} from './dto/friend.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  async getFriends(
    @Req() req,
    @Query('status') status?: 'pending' | 'accepted' | 'all',
  ): Promise<FriendListResponseDto> {
    return this.friendService.getFriends(req, status);
  }

  @Post('request')
  async requestFriend(
    @Req() req,
    @Body() dto: FriendRequestDto,
  ): Promise<FriendRequestResponseDto> {
    return this.friendService.requestFriend(req, dto);
  }

  @Put(':id/respond')
  async respondFriend(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: FriendRespondDto,
  ): Promise<FriendRespondResponseDto> {
    return this.friendService.respondFriend(req, id, dto);
  }

  @Post(':id/respond')
  async respondFriendPost(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: FriendRespondDto,
  ): Promise<FriendRespondResponseDto> {
    return this.friendService.respondFriend(req, id, dto);
  }

  @Get('recommend')
  async recommendUsers(@Req() req): Promise<RecommendFriendsResponseDto> {
    return this.friendService.recommendUsers(req);
  }

  // 팔로우 기능 추가
  @Post('follow')
  async followUser(
    @Req() req,
    @Body() dto: FollowDto,
  ): Promise<FollowResponseDto> {
    return this.friendService.followUser(req, dto);
  }

  @Delete('follow/:targetUserId')
  async unfollowUser(
    @Req() req,
    @Param('targetUserId') targetUserId: string,
  ): Promise<FollowResponseDto> {
    return this.friendService.unfollowUser(req, targetUserId);
  }

  @Get('followers')
  async getFollowers(@Req() req): Promise<FriendListResponseDto> {
    return this.friendService.getFollowers(req);
  }

  @Get('following')
  async getFollowing(@Req() req): Promise<FriendListResponseDto> {
    return this.friendService.getFollowing(req);
  }

  @Get('search')
  async searchUsers(
    @Req() req,
    @Query('query') query: string,
  ): Promise<{ users: any[] }> {
    return this.friendService.searchUsers(req, query);
  }
}

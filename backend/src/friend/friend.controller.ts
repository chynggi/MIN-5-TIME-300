import { Body, Controller, Get, Post, Put, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendService } from './friend.service';
import { FriendListResponseDto, FriendRequestDto, FriendRequestResponseDto, FriendRespondDto, FriendRespondResponseDto } from './dto/friend.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  async getFriends(@Req() req, @Query('status') status?: 'pending' | 'accepted' | 'all'): Promise<FriendListResponseDto> {
    return this.friendService.getFriends(req, status);
  }

  @Post('request')
  async requestFriend(@Req() req, @Body() dto: FriendRequestDto): Promise<FriendRequestResponseDto> {
    return this.friendService.requestFriend(req, dto);
  }

  @Put(':id/respond')
  async respondFriend(@Req() req, @Param('id') id: string, @Body() dto: FriendRespondDto): Promise<FriendRespondResponseDto> {
    return this.friendService.respondFriend(req, id, dto);
  }
}

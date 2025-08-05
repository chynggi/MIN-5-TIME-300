import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { SearchUsersDto } from './dto/search-users.dto';
import { SearchUserResponseDto } from './dto/search-user-response.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(
    @Req() req,
    @Query() dto: SearchUsersDto,
  ): Promise<{ users: SearchUserResponseDto[] }> {
    const currentUserId = req.user.userId;
    return this.usersService.searchUsers(currentUserId, dto);
  }
}

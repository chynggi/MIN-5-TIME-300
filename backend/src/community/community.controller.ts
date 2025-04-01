import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CommunityService } from './community.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiOperation({ summary: '커뮤니티 일기 목록 조회' })
  async getEntries(
    @Query('page') page = 1,
    @Query('emotion') emotion?: string,
    @Query('sortBy') sortBy?: 'latest' | 'popular' | 'comments',
    @Query('search') search?: string,
  ) {
    return this.communityService.getEntries({
      page: +page,
      emotion: emotion?.split(','),
      sortBy,
      search,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '새 일기 작성' })
  async createEntry(
    @Request() req,
    @Body() createEntryDto: CreateEntryDto,
  ) {
    return this.communityService.createEntry(req.user.id, createEntryDto);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '일기 좋아요 토글' })
  async toggleLike(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.toggleLike(req.user.id, id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '댓글 작성' })
  async addComment(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ) {
    return this.communityService.addComment(req.user.id, id, content);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '댓글 목록 조회' })
  async getComments(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.getComments(id);
  }
}
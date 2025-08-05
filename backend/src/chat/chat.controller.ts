
import { AuthGuard } from '@nestjs/passport';
import { Controller, UseGuards, Get, Post, Req, Param, Query, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoomListResponseDto, ChatMessageListResponseDto, SendMessageDto, SendMessageResponseDto, CreateChatRoomDto, CreateChatRoomResponseDto } from './dto/chat.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getChatRooms(@Req() req): Promise<ChatRoomListResponseDto> {
    return this.chatService.getChatRooms(req);
  }

  @Get('rooms/:id/messages')
  async getMessages(@Req() req, @Param('id') id: string, @Query() query): Promise<ChatMessageListResponseDto> {
    return this.chatService.getMessages(req, id, query);
  }

  @Post('rooms/:id/messages')
  async sendMessage(@Req() req, @Param('id') id: string, @Body() dto: SendMessageDto): Promise<SendMessageResponseDto> {
    return this.chatService.sendMessage(req, id, dto);
  }

  @Post('rooms')
  async createChatRoom(@Req() req, @Body() dto: CreateChatRoomDto): Promise<CreateChatRoomResponseDto> {
    return this.chatService.createChatRoom(req, dto);
  }

  @Post('rooms/:id/invite')
  async inviteToRoom(@Req() req, @Param('id') id: string, @Body('userId') userId: string) {
    return this.chatService.inviteToRoom(req, id, userId);
  }

  @Post('rooms/:id/leave')
  async leaveRoom(@Req() req, @Param('id') id: string) {
    return this.chatService.leaveRoom(req, id);
  }
  
  // alias for exit
  @Post('rooms/:id/exit')
  async exitRoom(@Req() req, @Param('id') id: string) {
    return this.chatService.leaveRoom(req, id);
  }
}

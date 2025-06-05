import { Body, Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatRoomListResponseDto, ChatMessageListResponseDto, SendMessageDto, SendMessageResponseDto, CreateChatRoomDto, CreateChatRoomResponseDto } from './dto/chat.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/chat_rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChatRooms(@Req() req): Promise<ChatRoomListResponseDto> {
    return this.chatService.getChatRooms(req);
  }

  @Get(':id/messages')
  async getMessages(@Req() req, @Param('id') id: string, @Query() query): Promise<ChatMessageListResponseDto> {
    return this.chatService.getMessages(req, id, query);
  }

  @Post(':id/messages')
  async sendMessage(@Req() req, @Param('id') id: string, @Body() dto: SendMessageDto): Promise<SendMessageResponseDto> {
    return this.chatService.sendMessage(req, id, dto);
  }

  @Post()
  async createChatRoom(@Req() req, @Body() dto: CreateChatRoomDto): Promise<CreateChatRoomResponseDto> {
    return this.chatService.createChatRoom(req, dto);
  }
}

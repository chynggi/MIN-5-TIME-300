
import { AuthGuard } from '@nestjs/passport';
import { Controller, UseGuards, Get, Post, Req, Param, Query, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto, ReadMessagesDto, MessageDto, ConversationDto } from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 대화 목록 조회
   */
  @Get('conversations')
  async getConversations(@Req() req): Promise<ConversationDto[]> {
    return this.chatService.getConversations(req.user.userId);
  }

  /**
   * 1:1 대화 생성 또는 기존 대화 찾기
   */
  @Post('conversations')
  async createOrGetConversation(
    @Req() req, 
    @Body() dto: CreateConversationDto
  ): Promise<ConversationDto> {
    return this.chatService.createOrGetConversation(req.user.userId, dto);
  }

  /**
   * 특정 대화의 메시지 목록 조회 (커서 기반 페이지네이션)
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req, 
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ): Promise<{ messages: MessageDto[]; nextCursor?: string }> {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    return this.chatService.getMessages(req.user.userId, conversationId, limitNum, cursor);
  }

  /**
   * 메시지 전송
   */
  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req, 
    @Param('id') conversationId: string, 
    @Body() dto: SendMessageDto
  ): Promise<MessageDto> {
    return this.chatService.sendMessage(req.user.userId, conversationId, dto);
  }

  /**
   * 메시지 읽음 처리
   */
  @Post('conversations/:id/read')
  async markMessagesAsRead(
    @Req() req, 
    @Param('id') conversationId: string, 
    @Body() dto: ReadMessagesDto
  ): Promise<{ success: boolean }> {
    await this.chatService.markMessagesAsRead(req.user.userId, conversationId, dto);
    return { success: true };
  }
}

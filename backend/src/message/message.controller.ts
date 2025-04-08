import { Controller, Get, Injectable, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('status')
  async getStatus(@Req() req) {
    const userId = req.user.id; // Assuming user ID is available in the request
    const hasNewMessages = await this.messageService.hasNewMessages(userId);
    return { status: hasNewMessages };
  }
}

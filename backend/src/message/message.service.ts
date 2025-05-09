import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageGateway } from './message.module';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  async hasNewMessages(userId: string): Promise<boolean> {
    const newMessagesCount = await this.prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return newMessagesCount > 0;
  }

  async createMessage(data: { senderId: string; recipientId: string; content: string }) {
    const message = await this.prisma.message.create({
      data,
    });

    // WebSocket을 통해 새 메시지 브로드캐스트
    this.messageGateway.broadcastMessage(message);

    return message;
  }
}

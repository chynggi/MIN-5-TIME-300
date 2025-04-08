import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async hasNewMessages(userId: string): Promise<boolean> {
    const newMessagesCount = await this.prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return newMessagesCount > 0;
  }
}

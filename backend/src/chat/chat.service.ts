import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateConversationDto,
  SendMessageDto,
  MessageDto,
  ConversationDto,
  ReadMessagesDto,
} from './dto';
import { ChatGateway } from './chat.gateway';
import { BaseService } from '../common/logger/base.service';

@Injectable()
export class ChatService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    super(ChatService.name);
  }

  /**
   * 1:1 대화 생성 또는 기존 대화 반환
   */
  async createOrGetConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationDto> {
    this.logger.debug(
      `createOrGetConversation user=${userId} recipient=${dto.recipientId}`,
    );
    const { recipientId } = dto;

    if (userId === recipientId) {
      throw new BadRequestException('자기 자신과는 대화할 수 없습니다.');
    }

    // 차단 상태 확인
    const isBlocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: userId },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenException('차단된 사용자와는 대화할 수 없습니다.');
    }

    // dmKey 생성: 두 userId를 정렬해서 일관성 보장
    const dmKey = [userId, recipientId].sort().join(':');

    // 기존 대화 찾기 또는 생성
    const conversation = await this.prisma.conversation.upsert({
      where: { dmKey },
      create: {
        dmKey,
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      update: {},
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
        lastMessage: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    return this.formatConversation(conversation, userId);
  }

  /**
   * 사용자의 모든 대화 목록 조회
   */
  async getConversations(userId: string): Promise<ConversationDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
        lastMessage: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      conversations.map((conv) => this.formatConversation(conv, userId)),
    );
  }

  /**
   * 특정 대화의 메시지 조회 (커서 기반 페이지네이션)
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit: number = 30,
    cursor?: string,
  ): Promise<{ messages: MessageDto[]; nextCursor?: string }> {
    // 대화 참여자 권한 확인
    await this.verifyConversationAccess(userId, conversationId);

    let where: any = {
      conversationId,
      deletedAt: null,
    };

    // 커서 기반 페이지네이션
    if (cursor) {
      const [createdAt, id] = cursor.split('_');
      where = {
        AND: [
          where,
          {
            OR: [
              { createdAt: { lt: new Date(createdAt) } },
              {
                createdAt: new Date(createdAt),
                id: { lt: id },
              },
            ],
          },
        ],
      };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
        deliveries: {
          where: { recipientId: userId },
          select: { status: true },
        },
      },
    });

    const nextCursor =
      messages.length === limit
        ? `${messages[messages.length - 1].createdAt.toISOString()}_${messages[messages.length - 1].id}`
        : undefined;

    return {
      messages: messages.map(this.formatMessage),
      nextCursor,
    };
  }

  /**
   * 메시지 전송
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    this.logger.debug(
      `sendMessage user=${userId} conversation=${conversationId} type=${dto.type || 'text'}`,
    );
    // 대화 참여자 권한 확인
    await this.verifyConversationAccess(userId, conversationId);

    const messageResult = await this.prisma.$transaction(async (tx) => {
      // 멱등성 체크
      if (dto.idempotencyKey) {
        const existingMessage = await tx.chatMessage.findFirst({
          where: {
            senderId: userId,
            idempotencyKey: dto.idempotencyKey,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
        });

        if (existingMessage) {
          return this.formatMessage(existingMessage);
        }
      }

      // 메시지 생성
      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId: userId,
          type: dto.type || 'text',
          content: dto.content,
          attachments: dto.attachments,
          replyToId: dto.replyToId,
          idempotencyKey: dto.idempotencyKey,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
        },
      });

      // 수신자 찾기 (나 제외)
      const recipients = await tx.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId },
        },
        select: { userId: true },
      });

      // 메시지 전달 상태 생성
      await Promise.all(
        recipients.map((recipient) =>
          tx.messageDelivery.create({
            data: {
              messageId: message.id,
              recipientId: recipient.userId,
              status: 'SENT',
            },
          }),
        ),
      );

      // 대화의 마지막 메시지 업데이트
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: message.id,
          updatedAt: new Date(),
        },
      });

      return this.formatMessage(message);
    });

    // 실시간 메시지 브로드캐스트
    this.chatGateway.broadcastMessage(conversationId, messageResult);

    return messageResult;
  }

  /**
   * 메시지 읽음 처리
   */
  async markMessagesAsRead(
    userId: string,
    conversationId: string,
    dto: ReadMessagesDto,
  ): Promise<void> {
    this.logger.debug(
      `markMessagesAsRead user=${userId} conversation=${conversationId} upTo=${dto.upToMessageId}`,
    );
    await this.verifyConversationAccess(userId, conversationId);

    await this.prisma.$transaction(async (tx) => {
      // 참여자 읽음 상태 업데이트
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: {
          lastReadMessageId: dto.upToMessageId,
          lastReadAt: new Date(),
        },
      });

      // 메시지 전달 상태를 READ로 업데이트
      await tx.messageDelivery.updateMany({
        where: {
          recipientId: userId,
          message: {
            conversationId,
            createdAt: {
              lte: (
                await tx.chatMessage.findUnique({
                  where: { id: dto.upToMessageId },
                  select: { createdAt: true },
                })
              )?.createdAt,
            },
          },
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });
    });

    // 실시간 읽음 상태 브로드캐스트
    this.chatGateway.broadcastMessageRead(conversationId, {
      userId,
      upToMessageId: dto.upToMessageId,
    });
  }

  /**
   * 대화 참여자 권한 확인
   */
  private async verifyConversationAccess(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('대화에 참여할 권한이 없습니다.');
    }
  }

  /**
   * 대화 정보 포맷팅
   */
  private async formatConversation(
    conversation: any,
    currentUserId: string,
  ): Promise<ConversationDto> {
    // 안 읽은 메시지 수 계산
    const participant = conversation.participants.find(
      (p: any) => p.userId === currentUserId,
    );
    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: currentUserId },
        deletedAt: null,
        createdAt: {
          gt: participant?.lastReadAt || new Date(0),
        },
      },
    });

    return {
      id: conversation.id,
      dmKey: conversation.dmKey,
      lastMessage: conversation.lastMessage
        ? this.formatMessage(conversation.lastMessage)
        : undefined,
      participants: conversation.participants.map((p: any) => ({
        userId: p.userId,
        user: p.user,
        lastReadAt: p.lastReadAt,
      })),
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * 메시지 정보 포맷팅
   */
  private formatMessage(message: any): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      attachments: message.attachments,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      sender: message.sender,
      deliveryStatus: message.deliveries?.[0]?.status,
    };
  }
}

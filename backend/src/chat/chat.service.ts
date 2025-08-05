import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatRoomListResponseDto, ChatMessageListResponseDto, SendMessageDto, SendMessageResponseDto, CreateChatRoomDto, CreateChatRoomResponseDto } from './dto/chat.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getChatRooms(req: any): Promise<ChatRoomListResponseDto> {
    const userId = req.user.userId;
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      chatRooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        participants: r.participants.map(p => ({
          id: p.user.id,
          username: p.user.username,
          profileImageUrl: p.user.profileImageUrl || undefined,
        })),
        lastMessage: r.messages[0]
          ? {
              content: r.messages[0].content,
              createdAt: r.messages[0].createdAt.toISOString(),
              sender: {
                id: r.messages[0].sender.id,
                username: r.messages[0].sender.username,
              },
            }
          : undefined,
        unreadCount: 0, // 추후 구현
      })),
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        participants: r.participants.map(p => ({
          id: p.user.id,
          username: p.user.username,
          profileImageUrl: p.user.profileImageUrl || undefined,
        })),
        lastMessage: r.messages[0]
          ? {
              content: r.messages[0].content,
              createdAt: r.messages[0].createdAt.toISOString(),
              sender: {
                id: r.messages[0].sender.id,
                username: r.messages[0].sender.username,
              },
            }
          : undefined,
        unreadCount: 0, // 추후 구현
      })),
    };
  }

  async getMessages(req: any, id: string, query: any): Promise<ChatMessageListResponseDto> {
    const userId = req.user.userId;
    const room = await this.prisma.chatRoom.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (!room.participants.some(p => p.userId === userId)) throw new ForbiddenException('참여자만 메시지 조회 가능');
    const limit = Number(query.limit) || 20;
    const before = query.before;
    const where: any = { chatRoomId: id };
    if (before) {
      where.id = { lt: before };
    }
    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: true },
    });
    return {
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          profileImageUrl: m.sender.profileImageUrl || undefined,
        },
        isRead: m.isRead,
      })),
      hasMore: messages.length === limit,
    };
  }

  async sendMessage(req: any, id: string, dto: SendMessageDto): Promise<SendMessageResponseDto> {
    const userId = req.user.userId;
    const room = await this.prisma.chatRoom.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (!room.participants.some(p => p.userId === userId)) throw new ForbiddenException('참여자만 메시지 전송 가능');
    const message = await this.prisma.message.create({
      data: {
        chatRoomId: id,
        senderId: userId,
        content: dto.content,
      },
    });
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead,
    };
  }

  async createChatRoom(req: any, dto: CreateChatRoomDto): Promise<CreateChatRoomResponseDto> {
    const userId = req.user.userId;
    const participants = Array.from(new Set([userId, ...dto.participants]));
    const room = await this.prisma.chatRoom.create({
      data: {
        name: dto.name || '',
        participants: {
          create: participants.map(pid => ({ userId: pid })),
        },
      },
      include: {
        participants: { include: { user: true } },
      },
    });
    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt.toISOString(),
      participants: room.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        profileImageUrl: p.user.profileImageUrl || undefined,
      })),
    };
  }

  async inviteToRoom(req: any, roomId: string, userId: string) {
    const myUserId = req.user.userId;
    // 채팅방 존재 및 권한 확인
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (!room.participants.some(p => p.userId === myUserId)) throw new ForbiddenException('참여자만 초대 가능');
    if (room.participants.some(p => p.userId === userId)) throw new ForbiddenException('이미 참여 중인 유저입니다.');
    // 초대(참가자 추가)
    await this.prisma.chatRoomParticipant.create({
      data: {
        chatRoomId: roomId,
        userId,
      },
    });
    return { success: true };
  }
  

  async leaveRoom(req: any, roomId: string) {
    const userId = req.user.userId;
    // 참가자 레코드 삭제
    const participant = await this.prisma.chatRoomParticipant.findFirst({
      where: { chatRoomId: roomId, userId },
    });
    if (!participant) throw new NotFoundException('참여 중인 채팅방이 아닙니다.');
    await this.prisma.chatRoomParticipant.delete({ where: { id: participant.id } });
    return { success: true };
  }
}

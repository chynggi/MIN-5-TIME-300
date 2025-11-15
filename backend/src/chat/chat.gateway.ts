import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://chynggi.cafe24.com',
      'http://chynggi.cafe24.com',
    ],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  private server: Server;
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('ChatGateway 초기화 완료');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // JWT 토큰 검증 - query 또는 auth에서 토큰 가져오기
      let token = client.handshake.query.token as string;
      if (!token && client.handshake.auth?.token) {
        token = client.handshake.auth.token;
      }

      if (!token) {
        this.logger.warn(`토큰이 없는 연결 시도: ${client.id}`);
        client.disconnect();
        return;
      }

      // JWT 검증 시 secret 명시적으로 제공
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const payload = this.jwtService.verify(token, { secret });

      client.userId = payload.sub || payload.userId; // sub 또는 userId 지원
      client.username = payload.username || payload.email;

      // 사용자 소켓 추가
      const userId = client.userId!;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // 사용자의 모든 대화방에 입장
      const conversations = await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      conversations.forEach((conv) => {
        client.join(`conversation:${conv.conversationId}`);
      });

      // 사용자 온라인 상태 브로드캐스트
      this.broadcastUserStatus(userId, 'online');

      this.logger.log(`사용자 연결: ${client.username} (${client.id})`);
    } catch (error) {
      this.logger.error(`연결 인증 실패: ${error.message}`);
      this.logger.debug(
        `Token: ${client.handshake.query.token || client.handshake.auth?.token}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userId = client.userId;
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);

        // 마지막 소켓이면 오프라인 상태로 변경
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          this.broadcastUserStatus(userId, 'offline');
        }
      }

      this.logger.log(`사용자 연결 해제: ${client.username} (${client.id})`);
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.debug(
      `${client.username}이 대화방 ${data.conversationId}에 입장`,
    );
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.debug(
      `${client.username}이 대화방 ${data.conversationId}에서 퇴장`,
    );
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; until: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // 대화방의 다른 참여자들에게 타이핑 상태 전송
    client.to(`conversation:${data.conversationId}`).emit('typing', {
      userId: client.userId,
      until: data.until,
    });
  }

  /**
   * 새 메시지를 대화방 참여자들에게 브로드캐스트
   */
  broadcastMessage(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message.created', message);
  }

  /**
   * 메시지 읽음 상태를 브로드캐스트
   */
  broadcastMessageRead(
    conversationId: string,
    data: { userId: string; upToMessageId: string },
  ) {
    this.server.to(`conversation:${conversationId}`).emit('message.read', data);
  }

  /**
   * 사용자 온라인/오프라인 상태 브로드캐스트
   */
  private async broadcastUserStatus(
    userId: string,
    status: 'online' | 'offline',
  ) {
    // 해당 사용자가 참여한 모든 대화방에 상태 변경 알림
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    conversations.forEach((conv) => {
      this.server
        .to(`conversation:${conv.conversationId}`)
        .emit(`user.${status}`, { userId });
    });
  }

  /**
   * 특정 사용자에게 개인 메시지 전송
   */
  sendToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * 대화방에 메시지 브로드캐스트 (외부에서 호출용)
   */
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}

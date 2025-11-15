import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
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
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private server: Server;
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('RealtimeGateway 초기화 완료');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      let token = client.handshake.query.token as string;
      if (!token && client.handshake.auth?.token) {
        token = client.handshake.auth.token as string;
      }
      if (!token) {
        this.logger.warn(`토큰 없이 실시간 게이트웨이 연결 시도: ${client.id}`);
        client.disconnect();
        return;
      }

      const secret = process.env.JWT_SECRET || 'dev-secret';
      const payload: any = this.jwtService.verify(token, { secret });
      client.userId = payload.sub || payload.userId;
      client.username = payload.username || payload.email;

      if (client.userId) {
        if (!this.userSockets.has(client.userId)) {
          this.userSockets.set(client.userId, new Set());
        }
        this.userSockets.get(client.userId)!.add(client.id);
        // 자신의 프로필 룸 자동 가입 (본인 카운터 업데이트 수신)
        client.join(`user:${client.userId}`);
      }

      this.logger.log(`Realtime 연결: ${client.username} (${client.id})`);
    } catch (e: any) {
      this.logger.error(`Realtime 인증 실패: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const set = this.userSockets.get(client.userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) this.userSockets.delete(client.userId);
      }
    }
  }

  @SubscribeMessage('profile.subscribe')
  handleSubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!data?.userId) return;
    // TODO: 프로필 프라이버시 정책 적용 시 다음 Hook에서 검증
    // this.canSubscribeToProfile(client.userId, data.userId)
    //   .then(can => { if (can) client.join(`user:${data.userId}`); })
    //   .catch(() => {/* 거부 시 아무 처리 안함 혹은 에러 이벤트 */});
    client.join(`user:${data.userId}`);
    this.logger.debug(`클라이언트 ${client.id} -> user:${data.userId} 구독`);
  }

  @SubscribeMessage('profile.unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!data?.userId) return;
    client.leave(`user:${data.userId}`);
    this.logger.debug(
      `클라이언트 ${client.id} -> user:${data.userId} 구독 해제`,
    );
  }

  /**
   * 특정 사용자 프로필 카운터 갱신 브로드캐스트
   */
  emitProfileCountersUpdate(payload: {
    userId: string;
    followerCount?: number;
    followingCount?: number;
    diaryCount?: number;
  }) {
    if (!this.server) return;
    this.server
      .to(`user:${payload.userId}`)
      .emit('profile.counters.update', payload);
  }

  // 프라이버시 검증 Skeleton (미구현)
  // 향후 ProfileService 주입 후 visibility 정책 검사 추가 예정
  private async canSubscribeToProfile(
    requesterId: string | undefined,
    targetUserId: string,
  ): Promise<boolean> {
    if (!targetUserId) return false;
    // 자신의 프로필은 항상 허용
    if (requesterId && requesterId === targetUserId) return true;
    // TODO: 비공개 프로필이면 팔로우 관계/권한 검사 필요
    return true; // 기본 허용 (현행 유지)
  }

  /**
   * 활동지수/레벨 업데이트 브로드캐스트
   */
  emitActivityUpdate(payload: {
    userId: string;
    activityScore: number;
    activityLevel: number;
  }) {
    if (!this.server) return;
    this.server.to(`user:${payload.userId}`).emit('activity.update', payload);
  }
}

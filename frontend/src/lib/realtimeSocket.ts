import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from './baseUrl';

let realtimeSocket: Socket | null = null;

export function getRealtimeSocket(originOverride?: string) {
  if (!realtimeSocket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
    const origin = (originOverride || API_ORIGIN).replace(/\/$/, '');
    // 실시간 네임스페이스를 /api/v1/realtime 으로 통일 (백엔드 라우팅 가정)
    realtimeSocket = io(`${origin}/api/v1/realtime`, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
  }
  return realtimeSocket;
}

export function disconnectRealtimeSocket() {
  if (realtimeSocket) {
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }
}

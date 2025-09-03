import { io, Socket } from 'socket.io-client';

let realtimeSocket: Socket | null = null;

export function getRealtimeSocket(baseUrl?: string) {
  if (!realtimeSocket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
    let apiUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // backend가 /api prefix 를 사용하는 경우 제거 (게이트웨이는 루트)
    apiUrl = apiUrl.replace(/\/$/, '');
    realtimeSocket = io(`${apiUrl}/realtime`, {
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

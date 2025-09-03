## Realtime Module / Gateway Guide

### 개요
`RealtimeGateway` 는 `/realtime` namespace 에서 WebSocket(Socket.IO) 통신을 제공하며 프로필/팔로우/일기 관련 실시간 이벤트를 브로드캐스트합니다.

### 구조
```
realtime/
  realtime.gateway.ts  # 인증 및 룸 관리 + emit 메서드
  realtime.module.ts   # Gateway export (다른 모듈에서 주입)
```

### 룸 네이밍 규칙
| 타입 | 패턴 | 설명 |
|------|------|------|
| 사용자 단위 | `user:{userId}` | 그 사용자의 프로필/카운터 변동 이벤트 |
| (확장 예정) 대화방 | `conversation:{id}` | 채팅 모듈 별도 gateway 참고 |

### 현재 사용 이벤트
| 이벤트명 | 방향 | Payload | 설명 |
|----------|------|---------|------|
| `profile.counters.update` | Server -> Client | `{ userId; followerCount?; followingCount?; diaryCount? }` | 전달된 필드만 부분 갱신 (optional) |

### 이벤트 추가 절차
1. Gateway에 emit 메서드 추가 (도메인/리소스/액션 네이밍)
2. 비즈니스 서비스에서 로직 처리 후 emit 호출
3. 프론트 소켓에서 해당 이벤트 on() 등록 → 상태 patch
4. 수동/자동 테스트 수행

### 예시: 아바타 변경 실시간 반영
Gateway:
```ts
emitProfileAvatarUpdate(payload: { userId: string; profileImageUrl: string; updatedAt: string }) {
  this.server.to(`user:${payload.userId}`).emit('profile.avatar.update', payload);
}
```
Service:
```ts
this.realtimeGateway.emitProfileAvatarUpdate({ userId, profileImageUrl: url, updatedAt: new Date().toISOString() });
```
Frontend:
```ts
socket.on('profile.avatar.update', (d) => {
  if (d.userId === currentUserId) setProfile(p => ({ ...p, profileImageUrl: d.profileImageUrl }));
});
```

### 인증 방식
JWT 토큰을 `auth.token` 또는 `query.token` 로 전달. `JWT_SECRET` 환경변수 사용. 실패 시 소켓 연결 거절.

### 확장/운영 팁
| 항목 | 권장 |
|------|------|
| 배포 확장 | 다중 인스턴스 시 Redis Adapter (`@socket.io/redis-adapter`) 추가 |
| Payload 버전 | 중대한 변경 예고 시 `version` 필드 도입 |
| 에러 로깅 | emit 직후 try/catch 보다 Gateway 레벨 중앙 로깅/미들웨어 고려 |
| 보안 | 민감 정보(토큰, 이메일) Payload 포함 금지 |

### 선택적 개선 아이디어
- 사용자 상태(온라인/오프라인) 통합: 기존 ChatGateway 와 상태 이벤트 합치기 혹은 cross-emit.
- 배치 브로드캐스트: 팔로우 폭주 상황에서 300ms debounce 후 마지막 카운트만 전송.
- 테스트: e2e 테스트에서 socket.io-client 이용하여 follow → 이벤트 수신 검증.

---
유지보수 시 이 문서 업데이트 후 PR에 링크 첨부 바랍니다.

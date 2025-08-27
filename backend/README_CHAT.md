# 1:1 채팅 시스템 구현 가이드

## 📋 개요

MIN-5-TIME-300 프로젝트에 1:1 채팅 기능을 구현했습니다. 친구 프로필에서 메시지 버튼을 클릭하면 채팅방으로 이동하고, 첫 메시지를 보낼 때 채팅방이 생성되는 구조입니다.

## 🗄️ 데이터베이스 스키마

### 핵심 테이블

#### 1. `Conversation` - 대화
```sql
- id: UUID (Primary Key)
- dmKey: String (Unique) - "userId1:userId2" 형태로 중복 방지
- lastMessageId: String (nullable) - 마지막 메시지 참조
- createdAt, updatedAt: DateTime
```

#### 2. `ConversationParticipant` - 대화 참여자
```sql
- conversationId: String
- userId: String
- joinedAt: DateTime
- lastReadMessageId: String (nullable)
- lastReadAt: DateTime (nullable)
- notificationsMuted: Boolean
```

#### 3. `ChatMessage` - 채팅 메시지
```sql
- id: UUID (Primary Key)
- conversationId: String
- senderId: String
- type: MessageType (text, image, file, audio, video, system)
- content: String (nullable)
- attachments: JSON (nullable)
- replyToId: String (nullable)
- idempotencyKey: String (nullable) - 중복 전송 방지
- createdAt, editedAt, deletedAt: DateTime
```

#### 4. `MessageDelivery` - 메시지 전달 상태
```sql
- messageId: String
- recipientId: String
- status: MessageDeliveryStatus (SENT, DELIVERED, READ)
- deliveredAt, readAt: DateTime (nullable)
```

## 🚀 API 엔드포인트

### 1. 대화 목록 조회
```http
GET /api/v1/chat/conversations
Authorization: Bearer {token}
```

**응답:**
```json
[
  {
    "id": "conversation-uuid",
    "dmKey": "user1:user2",
    "lastMessage": {
      "id": "message-uuid",
      "content": "안녕하세요!",
      "createdAt": "2025-08-27T07:00:00Z",
      "sender": {
        "id": "user-uuid",
        "username": "사용자명",
        "profileImageUrl": "https://..."
      }
    },
    "participants": [...],
    "unreadCount": 3,
    "createdAt": "2025-08-27T06:00:00Z",
    "updatedAt": "2025-08-27T07:00:00Z"
  }
]
```

### 2. 1:1 대화 생성 또는 기존 대화 찾기
```http
POST /api/v1/chat/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "recipient-user-uuid"
}
```

### 3. 메시지 목록 조회 (커서 기반 페이지네이션)
```http
GET /api/v1/chat/conversations/{conversationId}/messages?limit=30&cursor=2025-08-27T07:00:00Z_messageId
Authorization: Bearer {token}
```

**응답:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "conversationId": "conversation-uuid",
      "senderId": "user-uuid",
      "type": "text",
      "content": "메시지 내용",
      "createdAt": "2025-08-27T07:00:00Z",
      "sender": {
        "id": "user-uuid",
        "username": "사용자명",
        "profileImageUrl": "https://..."
      },
      "deliveryStatus": "READ"
    }
  ],
  "nextCursor": "2025-08-27T06:50:00Z_nextMessageId"
}
```

### 4. 메시지 전송
```http
POST /api/v1/chat/conversations/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "안녕하세요!",
  "type": "text",
  "idempotencyKey": "unique-key-uuid"
}
```

### 5. 메시지 읽음 처리
```http
POST /api/v1/chat/conversations/{conversationId}/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "upToMessageId": "message-uuid"
}
```

## 🔧 주요 기능

### 1. 멱등성 보장
- `idempotencyKey`를 사용하여 중복 메시지 전송 방지
- 모바일 네트워크 불안정 상황에서 재시도 안전

### 2. 커서 기반 페이지네이션
- `createdAt` + `id` 조합으로 안정적인 페이지네이션
- 동시간대 메시지 정렬 일관성 보장

### 3. 읽음 상태 관리
- 참여자별 `lastReadAt`, `lastReadMessageId` 추적
- 메시지별 개별 읽음 상태 (`MessageDelivery`)

### 4. 차단 사용자 보호
- 대화 생성 시 차단 상태 확인
- 차단된 사용자와는 대화 불가

## 📊 성능 최적화

### 인덱스 구성
```sql
-- 메시지 커서 페이지네이션용
CREATE INDEX idx_message_conv_cursor 
ON ChatMessage(conversationId, createdAt DESC, id DESC);

-- 멱등성 체크용 (부분 유니크)
CREATE UNIQUE INDEX uniq_message_idempotency 
ON ChatMessage(senderId, idempotencyKey) 
WHERE idempotencyKey IS NOT NULL;

-- 읽음 상태 조회용
CREATE INDEX idx_message_read_status 
ON MessageDelivery(recipientId, status, messageId);
```

## 🎯 프론트엔드 구현 가이드

### 친구 프로필에서 메시지 버튼 클릭 플로우

1. **메시지 버튼 클릭**
   ```typescript
   const handleMessageClick = async (friendId: string) => {
     try {
       const conversation = await fetch('/api/v1/chat/conversations', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ recipientId: friendId })
       }).then(res => res.json());
       
       // 채팅방 페이지로 이동
       router.push(`/chat/${conversation.id}`);
     } catch (error) {
       console.error('대화 생성 실패:', error);
     }
   };
   ```

2. **채팅방 페이지에서 메시지 로드**
   ```typescript
   const loadMessages = async (conversationId: string, cursor?: string) => {
     const url = `/api/v1/chat/conversations/${conversationId}/messages?limit=30${cursor ? `&cursor=${cursor}` : ''}`;
     const response = await fetch(url);
     const data = await response.json();
     return data;
   };
   ```

3. **메시지 전송**
   ```typescript
   const sendMessage = async (conversationId: string, content: string) => {
     const idempotencyKey = generateUUID(); // 클라이언트에서 UUID 생성
     
     // 낙관적 UI 업데이트
     const tempMessage = {
       id: 'temp-' + Date.now(),
       content,
       createdAt: new Date(),
       status: 'sending'
     };
     setMessages(prev => [tempMessage, ...prev]);
     
     try {
       const message = await fetch(`/api/v1/chat/conversations/${conversationId}/messages`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ content, idempotencyKey })
       }).then(res => res.json());
       
       // 임시 메시지를 실제 메시지로 교체
       setMessages(prev => prev.map(m => m.id === tempMessage.id ? message : m));
     } catch (error) {
       // 에러 처리: 임시 메시지 제거 또는 재시도 UI
       setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
     }
   };
   ```

4. **읽음 처리**
   ```typescript
   const markAsRead = async (conversationId: string, messageId: string) => {
     await fetch(`/api/v1/chat/conversations/${conversationId}/read`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ upToMessageId: messageId })
     });
   };
   
   // 스크롤 감지로 자동 읽음 처리
   useEffect(() => {
     const handleScroll = () => {
       const lastMessage = messages[0];
       if (lastMessage && lastMessage.senderId !== currentUserId) {
         markAsRead(conversationId, lastMessage.id);
       }
     };
     
     // Intersection Observer로 최적화 가능
   }, [messages]);
   ```

## 🔮 다음 단계: 실시간 기능

WebSocket 연동을 통한 실시간 메시지 전송/수신은 다음 단계에서 구현할 예정입니다:

1. **Socket.IO 또는 WebSocket 서버 설정**
2. **채널 관리**: `conversation:{id}` 형태
3. **실시간 이벤트**: `message.created`, `message.read`, `typing`
4. **연결 관리**: 재접속, 오프라인 처리

## 📝 마이그레이션 실행

```bash
# 백엔드 디렉토리에서
cd backend
npx prisma migrate dev --name add_1on1_chat_system
npm run start:dev
```

---

이제 1:1 채팅의 백엔드 구조가 완전히 준비되었습니다! 🎉
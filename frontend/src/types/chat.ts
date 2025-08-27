export interface User {
  id: string;
  username: string;
  profileImageUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  content?: string;
  attachments?: any;
  replyToId?: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  sender: User;
  deliveryStatus?: 'SENT' | 'DELIVERED' | 'READ';
  isTemporary?: boolean; // 낙관적 UI용
}

export interface ConversationParticipant {
  userId: string;
  user: User;
  lastReadAt?: string;
}

export interface Conversation {
  id: string;
  dmKey: string;
  lastMessage?: Message;
  participants: ConversationParticipant[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  messages: Message[];
  nextCursor?: string;
}

export interface SendMessageRequest {
  content?: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  attachments?: any;
  replyToId?: string;
  idempotencyKey?: string;
}

export interface ReadMessagesRequest {
  upToMessageId: string;
}

export interface CreateConversationRequest {
  recipientId: string;
}
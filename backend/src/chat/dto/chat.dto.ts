import { IsString, IsOptional, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'file', 'audio', 'video', 'system'])
  type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';

  @IsOptional()
  attachments?: any;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class ReadMessagesDto {
  @IsUUID()
  @IsNotEmpty()
  upToMessageId: string;
}

export class UserDto {
  id: string;
  username: string;
  profileImageUrl?: string;
}

export class MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content?: string;
  attachments?: any;
  replyToId?: string;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  sender: UserDto;
  deliveryStatus?: 'SENT' | 'DELIVERED' | 'READ';
}

export class ConversationParticipantDto {
  userId: string;
  user: UserDto;
  lastReadAt?: Date;
}

export class ConversationDto {
  id: string;
  dmKey: string;
  lastMessage?: MessageDto;
  participants: ConversationParticipantDto[];
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 응답 전용 DTO들
export class MessageListResponseDto {
  messages: MessageDto[];
  nextCursor?: string;
}

export class SuccessResponseDto {
  success: boolean;
}

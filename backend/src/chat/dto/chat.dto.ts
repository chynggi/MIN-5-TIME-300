import { IsString, IsOptional, IsArray } from 'class-validator';

export class ChatRoomParticipantDto {
  id: string;
  username: string;
  profileImageUrl?: string;
}

export class ChatRoomLastMessageDto {
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
  };
}

export class ChatRoomListItemDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatRoomParticipantDto[];
  lastMessage?: ChatRoomLastMessageDto;
  unreadCount: number;
}

export class ChatRoomListResponseDto {
  chatRooms: ChatRoomListItemDto[];
  rooms?: ChatRoomListItemDto[]; // 호환성을 위한 추가 프로퍼티
}

export class ChatMessageDto {
  id: string;
  content: string;
  createdAt: string;
  sender: ChatRoomParticipantDto;
  isRead: boolean;
}

export class ChatMessageListResponseDto {
  messages: ChatMessageDto[];
  hasMore: boolean;
}

export class SendMessageDto {
  @IsString()
  content: string;
}

export class SendMessageResponseDto {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export class CreateChatRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  participants: string[];
}

export class CreateChatRoomResponseDto {
  id: string;
  name: string;
  createdAt: string;
  participants: ChatRoomParticipantDto[];
}

export interface ChatRoomParticipantDto {
  id: string;
  username: string;
  profileImageUrl?: string;
}

export interface ChatRoomLastMessageDto {
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
  };
}

export interface ChatRoomListItemDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatRoomParticipantDto[];
  lastMessage?: ChatRoomLastMessageDto;
  unreadCount: number;
}

export interface ChatRoomListResponseDto {
  chatRooms: ChatRoomListItemDto[];
}

export interface ChatMessageDto {
  id: string;
  content: string;
  createdAt: string;
  sender: ChatRoomParticipantDto;
  isRead: boolean;
}

export interface ChatMessageListResponseDto {
  messages: ChatMessageDto[];
  hasMore: boolean;
}

export interface SendMessageDto {
  content: string;
}

export interface SendMessageResponseDto {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface CreateChatRoomDto {
  name?: string;
  participants: string[];
}

export interface CreateChatRoomResponseDto {
  id: string;
  name: string;
  createdAt: string;
  participants: ChatRoomParticipantDto[];
}

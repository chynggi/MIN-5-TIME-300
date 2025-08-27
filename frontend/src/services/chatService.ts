import { 
  Conversation, 
  Message, 
  MessageListResponse, 
  SendMessageRequest, 
  ReadMessagesRequest, 
  CreateConversationRequest 
} from '@/types/chat';

const API_BASE = (() => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // 프로덕션 환경에서 API 경로 수정
  if (url.includes('cafe24.com')) {
    url = url.replace(/\/$/, '') + '/api';
  }
  return url;
})();

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token'); // 'accessToken' → 'token'으로 변경
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * 대화 목록 조회
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('대화 목록 조회에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 1:1 대화 생성 또는 기존 대화 찾기
   */
  async createOrGetConversation(recipientId: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ recipientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '대화 생성에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 메시지 목록 조회 (커서 기반 페이지네이션)
   */
  async getMessages(
    conversationId: string, 
    limit: number = 30, 
    cursor?: string
  ): Promise<MessageListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    const response = await fetch(
      `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('메시지 조회에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 메시지 전송
   */
  async sendMessage(
    conversationId: string, 
    messageData: SendMessageRequest
  ): Promise<Message> {
    const response = await fetch(
      `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '메시지 전송에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 메시지 읽음 처리
   */
  async markMessagesAsRead(
    conversationId: string, 
    upToMessageId: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}/api/v1/chat/conversations/${conversationId}/read`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ upToMessageId }),
      }
    );

    if (!response.ok) {
      throw new Error('읽음 처리에 실패했습니다.');
    }
  }

  /**
   * 이미지 업로드
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token'); // 'accessToken' → 'token'으로 변경
    const response = await fetch(`${API_BASE}/api/v1/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('이미지 업로드에 실패했습니다.');
    }

    return response.json();
  }
}

export const chatService = new ChatService();
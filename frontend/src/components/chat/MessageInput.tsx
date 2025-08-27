'use client';

import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any) => void;
  onSendImage: (file: File) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onSendImage,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 메시지 전송
  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // 텍스트 영역 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, onSendMessage]);

  // 엔터 키 처리
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 입력 변경 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // 텍스트 영역 자동 크기 조정
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    
    // 타이핑 신호 전송 (쓰로틀링)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (!disabled) {
        onTyping();
      }
    }, 500);
  }, [disabled, onTyping]);

  // 이미지 파일 선택
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      try {
        await onSendImage(file);
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
      } finally {
        setIsUploading(false);
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [onSendImage]);

  // 이미지 버튼 클릭
  const handleImageButtonClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        {/* 이미지 업로드 버튼 */}
        <button
          onClick={handleImageButtonClick}
          disabled={disabled || isUploading}
          className={`flex-shrink-0 p-2 rounded-full transition-colors ${
            disabled || isUploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 메시지 입력 영역 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="메시지를 입력하세요"
            disabled={disabled}
            className={`w-full min-h-[40px] max-h-[120px] px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
            }`}
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          className={`flex-shrink-0 p-2 rounded-full transition-colors ${
            disabled || !message.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* 연결 상태 표시 */}
      {disabled && (
        <div className="mt-2 text-center text-xs text-gray-500">
          연결 중... 잠시만 기다려주세요.
        </div>
      )}
    </div>
  );
}
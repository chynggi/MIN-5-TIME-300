'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Message, User } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  typingUsers: Set<string>;
  otherUser?: User;
}

export function MessageList({
  messages,
  currentUserId,
  onLoadMore,
  hasMore,
  loadingMore,
  typingUsers,
  otherUser,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // 상단 스크롤 감지를 위한 ref 콜백
  const lastMessageElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, onLoadMore]
  );

  // 메시지 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // 날짜 구분선 표시 여부 확인
  const shouldShowDateSeparator = (current: Message, previous?: Message) => {
    if (!previous) return true;
    
    const currentDate = new Date(current.createdAt).toDateString();
    const previousDate = new Date(previous.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  // 연속된 메시지 여부 확인
  const isConsecutiveMessage = (current: Message, next?: Message) => {
    if (!next) return false;
    if (current.senderId !== next.senderId) return false;
    
    const currentTime = new Date(current.createdAt);
    const nextTime = new Date(next.createdAt);
    const timeDiff = Math.abs(currentTime.getTime() - nextTime.getTime());
    
    return timeDiff < 5 * 60 * 1000; // 5분 이내
  };

  // 메시지 렌더링
  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.senderId === currentUserId;
    const prevMessage = messages[index + 1];
    const nextMessage = messages[index - 1];
    const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
    const isConsecutive = isConsecutiveMessage(message, nextMessage);
    const showAvatar = !isOwn && !isConsecutive;
    const showTime = !isConsecutive;

    return (
      <div key={message.id}>
        {/* 날짜 구분선 */}
        {showDateSeparator && (
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              {new Date(message.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        )}

        {/* 메시지 */}
        <div
          ref={index === messages.length - 1 ? lastMessageElementRef : null}
          className={`flex items-start space-x-2 mb-2 ${
            isOwn ? 'flex-row-reverse space-x-reverse' : ''
          } ${isConsecutive ? 'mb-1' : 'mb-3'}`}
        >
          {/* 프로필 이미지 */}
          {showAvatar && (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {otherUser?.profileImageUrl ? (
                <Image
                  src={otherUser.profileImageUrl}
                  alt={otherUser.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {!showAvatar && !isOwn && <div className="w-8" />}

          {/* 메시지 내용 */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
            {/* 메시지 버블 */}
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwn
                  ? 'bg-purple-500 text-white'
                  : 'bg-blue-500 text-white'
              } ${message.isTemporary ? 'opacity-60' : ''}`}
            >
              {message.type === 'image' && message.attachments ? (
                <div className="relative">
                  <Image
                    src={message.attachments.url}
                    alt="이미지"
                    width={200}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                  />
                  {message.content && (
                    <p className="mt-2 text-sm">{message.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>

            {/* 시간 및 읽음 상태 */}
            {showTime && (
              <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                isOwn ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <span>{formatTime(message.createdAt)}</span>
                {isOwn && message.deliveryStatus && (
                  <span className={`text-xs ${
                    message.deliveryStatus === 'READ' ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {message.deliveryStatus === 'READ' ? '읽음' : '전송됨'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" ref={containerRef}>
      {/* 로딩 더 보기 */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
        </div>
      )}

      {/* 메시지 목록 (역순으로 표시) */}
      <div className="flex flex-col-reverse">
        {/* 타이핑 표시 */}
        {typingUsers.size > 0 && (
          <div className="flex items-start space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
              {otherUser?.profileImageUrl ? (
                <Image
                  src={otherUser.profileImageUrl}
                  alt={otherUser.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => renderMessage(message, index))}
      </div>

      {/* 메시지가 없을 때 */}
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">💬</p>
            <p>대화를 시작해보세요!</p>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState } from "react";
import { ChatList } from "@/components/chat/ChatList";

export default function ChatListPage() {
  return (
    <div className="h-screen bg-gray-50">
      {/* 채팅방 목록을 전체 화면으로 표시 */}
      <ChatList 
        isOpen={true} 
        onClose={() => window.history.back()} 
      />
    </div>
  );
}

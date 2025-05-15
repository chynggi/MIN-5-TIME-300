"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import styles from "@/styles/Diary.module.css";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await apiClient.get("/messages");
        setMessages(response.data);
      } catch (err) {
        console.error("메시지 불러오기 오류:", err);

        // 에러 메시지 개선
        setError("메시지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    };

    fetchMessages();

    // WebSocket 연결 설정
    socketRef.current = new WebSocket("ws://localhost:3001/messages");

    socketRef.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    socketRef.current.onerror = (err) => {
      console.error("WebSocket 오류:", err);

      // 에러 메시지 개선
      setError("실시간 메시지 업데이트에 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      alert("메시지를 입력하세요.");
      return;
    }

    try {
      const response = await apiClient.post("/messages", { content: newMessage });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");

      // 성공 알림
      alert("메시지가 성공적으로 전송되었습니다!");

      // WebSocket을 통해 서버에 메시지 전송
      socketRef.current?.send(JSON.stringify(response.data));
    } catch (err) {
      console.error("메시지 전송 오류:", err);

      // 실패 알림
      alert("메시지를 전송하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className={styles.title}>메시지</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.messagesList}>
        {messages.map((message) => (
          <div key={message.id} className={styles.messageItem}>
            <div className={styles.messageSender}>{message.sender}</div>
            <div className={styles.messageContent}>{message.content}</div>
            <div className={styles.messageTimestamp}>{new Date(message.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className={styles.messageInputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요"
          className={styles.messageInput}
        />
        <button onClick={handleSendMessage} className={styles.sendButton}>
          전송
        </button>
      </div>
    </div>
  );
}
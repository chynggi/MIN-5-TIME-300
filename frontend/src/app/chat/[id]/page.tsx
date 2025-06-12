"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getSocket } from "@/lib/socket";

interface Message {
  id?: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
}

function InviteFriendModal({ open, onClose, onInvite, loading, error }: { open: boolean, onClose: () => void, onInvite: (userId: string) => void, loading: boolean, error: string }) {
  const [userId, setUserId] = useState("");
  useEffect(() => { if (!open) setUserId(""); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-80">
        <h3 className="text-lg font-bold mb-2">친구 초대</h3>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="w-full border rounded px-2 py-1 mb-2"
          placeholder="초대할 친구 userId 입력"
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1">취소</button>
          <button onClick={() => onInvite(userId)} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={loading || !userId}>{loading ? "초대 중..." : "초대"}</button>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const handleInvite = async (userId: string) => {
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await api.post(`/chat/rooms/${id}/invite`, { userId });
      setInviteSuccess("초대 성공!");
      setTimeout(() => { setInviteOpen(false); setInviteSuccess(""); }, 1000);
    } catch (e: any) {
      setInviteError(e?.response?.data?.message || "초대 실패");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("정말로 채팅방을 나가시겠습니까?")) return;
    if (!confirm("정말로 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setLeaveLoading(true);
    setLeaveError("");
    try {
      await api.post(`/chat/rooms/${id}/leave`);
      router.push("/chat");
    } catch (e: any) {
      setLeaveError(e?.response?.data?.message || "나가기 실패");
    } finally {
      setLeaveLoading(false);
    }
  };

  useEffect(() => {
    api.get(`/chat/rooms/${id}`)
      .then(res => setRoom(res.data))
      .catch(() => setError("채팅방 정보를 불러오지 못했습니다."));
    api.get(`/chat/rooms/${id}/messages`)
      .then(res => setMessages(res.data.messages))
      .catch(() => setError("메시지 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("joinRoom", { roomId: id });
    socket.on("chatMessage", (msg: Message) => {
      setMessages(msgs => [...msgs, msg]);
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userId = localStorage.getItem("userId") || "me";
    // 소켓 전송
    socketRef.current?.emit("chatMessage", {
      roomId: id,
      message: input,
      senderId: userId,
    });
    setInput("");
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!room) return <div className="p-4">채팅방 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col h-[80vh]">
      <h2 className="text-2xl font-bold mb-2 flex items-center justify-between">
        {room.name}
        <div className="flex gap-2">
          <button onClick={() => { setInviteOpen(true); setInviteError(""); setInviteSuccess(""); }} className="px-3 py-1 bg-green-600 text-white rounded text-sm">친구 초대</button>
          <button onClick={handleLeave} className="px-3 py-1 bg-red-500 text-white rounded text-sm" disabled={leaveLoading}>{leaveLoading ? "나가는 중..." : "채팅방 나가기"}</button>
        </div>
      </h2>
      {leaveError && <div className="text-red-500 text-sm mb-2">{leaveError}</div>}
      <div className="flex-1 overflow-y-auto border rounded p-2 bg-gray-50 mb-2">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className="mb-1">
            <span className="font-semibold text-blue-700">{msg.senderId}</span>: {msg.content}
            <span className="text-xs text-gray-400 ml-2">{new Date(msg.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="메시지 입력..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">전송</button>
      </form>
      <InviteFriendModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        loading={inviteLoading}
        error={inviteError || inviteSuccess}
      />
    </div>
  );
}

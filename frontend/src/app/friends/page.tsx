"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface FriendUser {
  id: string;
  username: string;
  mbti: string;
  profileImageUrl?: string;
}
interface FriendListItem {
  id: string;
  user: FriendUser;
  status: "pending" | "accepted";
  createdAt: string;
  updatedAt: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [pending, setPending] = useState<FriendListItem[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestMsg, setRequestMsg] = useState("");

  const fetchFriends = () => {
    setLoading(true);
    Promise.all([
      api.get("/friends?status=accepted").then(res => res.data.friends).catch(() => []),
      api.get("/friends?status=pending").then(res => res.data.friends).catch(() => []),
    ])
      .then(([accepted, pending]) => {
        setFriends(accepted);
        setPending(pending);
      })
      .catch(() => setError("친구 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRequest = async () => {
    setRequestMsg("");
    setError("");
    if (!userId) return;
    try {
      const res = await api.post("/friends/request", { userId });
      setRequestMsg(res.data.message || "요청 완료");
      setUserId("");
      fetchFriends();
    } catch (e: any) {
      setError(e?.response?.data?.message || "요청 실패");
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    setError("");
    try {
      await api.put(`/friends/${id}/respond`, { accept });
      fetchFriends();
    } catch (e: any) {
      setError(e?.response?.data?.message || "처리 실패");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">친구 목록</h2>
      {loading ? <div>로딩 중...</div> : error ? <div className="text-red-500">{error}</div> : (
        <>
          <ul className="mb-6 space-y-2">
            {friends.length === 0 ? <li>친구가 없습니다.</li> : friends.map(f => (
              <li key={f.id} className="border rounded p-2 flex items-center gap-2">
                {f.user.profileImageUrl && <img src={f.user.profileImageUrl} alt="프로필" className="w-8 h-8 rounded-full" />}
                <span className="font-semibold">{f.user.username}</span>
                <span className="text-xs text-gray-400">{f.user.mbti}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-bold mb-2">받은 친구 요청</h3>
          <ul className="mb-6 space-y-2">
            {pending.length === 0 ? <li>받은 요청이 없습니다.</li> : pending.map(f => (
              <li key={f.id} className="border rounded p-2 flex items-center gap-2">
                {f.user.profileImageUrl && <img src={f.user.profileImageUrl} alt="프로필" className="w-8 h-8 rounded-full" />}
                <span className="font-semibold">{f.user.username}</span>
                <span className="text-xs text-gray-400">{f.user.mbti}</span>
                <button onClick={() => handleRespond(f.id, true)} className="ml-auto px-2 py-1 bg-blue-600 text-white rounded text-xs">수락</button>
                <button onClick={() => handleRespond(f.id, false)} className="px-2 py-1 bg-gray-300 rounded text-xs">거절</button>
              </li>
            ))}
          </ul>
          <div className="mb-2 font-bold">친구 요청 보내기</div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="상대 userId 입력"
              className="border rounded px-2 py-1 flex-1"
            />
            <button onClick={handleRequest} className="bg-blue-600 text-white px-4 py-1 rounded">요청</button>
          </div>
          {requestMsg && <div className="text-green-600 text-sm mb-2">{requestMsg}</div>}
        </>
      )}
    </div>
  );
}

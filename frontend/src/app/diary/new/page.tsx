"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";

export default function NewDiaryPage() {
  const router = useRouter();
  const [todayQuestion, setTodayQuestion] = useState<string>("");
  const [questionId, setQuestionId] = useState<string>("");
  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState("😊");
  const [isPublic, setIsPublic] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/diaries/today-question")
      .then(res => {
        setTodayQuestion(res.data.question);
        setQuestionId(res.data.questionId);
      })
      .catch(() => {
        setTodayQuestion("오늘의 질문을 불러오지 못했습니다.");
      });
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("questionId", questionId);
      formData.append("isPublic", String(isPublic));
      formData.append("emotion", emotion);
      if (image) formData.append("image", image);
      // writingDuration 등 추가 가능
      await api.post("/diaries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push("/diary");
    } catch (err: any) {
      setError("일기 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-pink-50 py-6">
      <div className="w-full max-w-md md:max-w-lg bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-bold mb-2">오늘의 일기</h2>
        <div className="mb-2">
          <span className="font-semibold">오늘의 질문:</span> <span className="text-blue-600">{todayQuestion}</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            className="border rounded p-2 w-full min-h-[100px]"
            placeholder="오늘의 감정, 경험, 생각을 자유롭게 적어보세요."
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1">
              <span>감정</span>
              <select value={emotion} onChange={e => setEmotion(e.target.value)} className="rounded border px-2 py-1">
                <option value="😊">😊</option>
                <option value="😢">😢</option>
                <option value="😡">😡</option>
                <option value="😎">😎</option>
                <option value="😐">😐</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span>공개</span>
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-blue-600" />
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">사진 첨부</label>
            <input type="file" accept="image/*" onChange={handleImage} />
            {preview && (
              <div className="relative mt-2">
                <img src={preview} alt="미리보기" className="w-32 h-32 object-cover rounded" />
                <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-white rounded-full px-2 py-1 text-xs border">삭제</button>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold" disabled={loading}>{loading ? "저장 중..." : "작성 완료"}</button>
            <Link href="/dashboard" className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-center">취소</Link>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
}

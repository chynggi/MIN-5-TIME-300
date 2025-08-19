"use client";
import { useState } from "react";

interface EmotionVoiceProps {
  emotion: string;
  onEmotionChange: (emotion: string) => void;
  onVoiceRecord: (audioBlob: Blob | null) => void;
}

const emotions = [
  { emoji: "😊", label: "행복" },
  { emoji: "😢", label: "슬픔" },
  { emoji: "😡", label: "화남" },
  { emoji: "😎", label: "멋짐" },
  { emoji: "😐", label: "무감정" },
  { emoji: "😴", label: "피곤" },
  { emoji: "🤗", label: "따뜻함" },
  { emoji: "😱", label: "놀람" },
];

export default function EmotionVoice({ emotion, onEmotionChange, onVoiceRecord }: EmotionVoiceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    if (isRecording) return; // 이미 녹음 중이면 무시
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudio(audioUrl);
        onVoiceRecord(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("음성 녹음을 시작할 수 없습니다:", error);
      alert("마이크 권한이 필요합니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    onVoiceRecord(null);
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        {/* 감정 선택 */}
        <div className="flex-1 mr-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">감정 선택</h3>
          <select
            value={emotion}
            onChange={(e) => onEmotionChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {emotions.map((item) => (
              <option key={item.emoji} value={item.emoji}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* 음성 메시지 */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">음성 메시지</h3>
          
          {!recordedAudio ? (
            <div className="text-center">
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 ${
                  isRecording
                    ? "bg-red-500 scale-110 shadow-lg animate-pulse"
                    : "bg-green-500 hover:bg-green-600 shadow-md"
                } text-white`}
              >
                🎤
              </button>
              <p className="text-xs text-gray-600 mt-1">
                {isRecording ? "녹음 중..." : "길게 눌러서 녹음"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">🎤 음성메시지</span>
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
              <audio controls className="w-full h-8">
                <source src={recordedAudio} type="audio/wav" />
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

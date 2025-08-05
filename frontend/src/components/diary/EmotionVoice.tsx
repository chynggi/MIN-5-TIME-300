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
    if (mediaRecorder) {
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
          <div className="grid grid-cols-4 gap-2">
            {emotions.map((item) => (
              <button
                key={item.emoji}
                type="button"
                onClick={() => onEmotionChange(item.emoji)}
                className={`p-2 rounded-lg border-2 text-center transition-colors ${
                  emotion === item.emoji
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="text-lg">{item.emoji}</div>
                <div className="text-xs text-gray-600">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 음성 메시지 */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">음성 메시지</h3>
          
          {!recordedAudio ? (
            <div className="text-center">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white`}
              >
                {isRecording ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                {isRecording ? "녹음 중..." : "음성 녹음"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">녹음된 음성</span>
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <audio controls className="w-full">
                <source src={recordedAudio} type="audio/wav" />
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

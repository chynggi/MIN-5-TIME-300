'use client';

import { useState, useRef, useEffect } from "react";

interface EmotionVoiceProps {
  emotion: string;
  onEmotionChange: (emotion: string) => void;
  onVoiceRecord?: (audioBlob: Blob | null) => void;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 시간 포맷팅 함수
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      setIsPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      let startTime = Date.now();

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);

        // 스트림 정리
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

        // 부모 컴포넌트에 음성 데이터 전달
        if (onVoiceRecord) {
          onVoiceRecord(audioBlob);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      // 녹음 시간 업데이트
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } catch (error) {
      console.error('녹음 권한 오류:', error);
      setIsPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      setRecordingDuration(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }
    setRecordedAudio(null);
    setIsPlaying(false);
    if (onVoiceRecord) {
      onVoiceRecord(null);
    }
  };

  // 오디오 재생 완료 시 처리
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => setIsPlaying(false);
      audioElement.addEventListener('ended', handleEnded);
      return () => audioElement.removeEventListener('ended', handleEnded);
    }
  }, [recordedAudio]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordedAudio]);

  return (
    <div className="flex gap-4 items-start">
      {/* 감정 선택 (드롭다운) */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">오늘의 감정</h3>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white shadow-sm"
            value={emotion}
            onChange={e => onEmotionChange(e.target.value)}
          >
            <option value="" disabled>감정을 선택하세요</option>
            {emotions.map((item) => (
              <option key={item.label} value={item.label}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">▼</span>
        </div>
      </div>

      {/* 음성 메시지 */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">음성 메시지</h3>
        {!recordedAudio ? (
          <div className="text-center">
            {/* 권한 거부 상태 */}
            {isPermissionDenied ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-600 text-sm mb-2">🚫 마이크 권한이 필요합니다</div>
                <button
                  type="button"
                  onClick={startRecording}
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              /* 녹음 버튼 */
              <div>
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 ${
                    isRecording
                      ? "bg-red-500 scale-110 shadow-lg"
                      : "bg-green-500 hover:bg-green-600 shadow-md"
                  } text-white`}
                >
                  {isRecording ? "⏹️" : "🎤"}
                </button>
                <p className="text-xs text-gray-600 mt-1">
                  {isRecording ? `녹음 중... ${formatDuration(recordingDuration)}` : "길게 눌러서 녹음"}
                </p>
                {isRecording && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div className="bg-red-500 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 녹음된 오디오 컨트롤 */
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">🎤 음성메시지</span>
              <button
                type="button"
                onClick={deleteRecording}
                className="text-red-500 hover:text-red-700 text-sm transition-colors"
              >
                삭제
              </button>
            </div>
            
            {/* 커스텀 오디오 컨트롤 */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={isPlaying ? pauseAudio : playAudio}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500">
                  {isPlaying ? "재생 중..." : "재생 준비됨"}
                </div>
              </div>
              
              <button
                type="button"
                onClick={startRecording}
                className="bg-green-500 text-white p-1 rounded text-xs hover:bg-green-600 transition-colors"
              >
                다시 녹음
              </button>
            </div>
            
            {/* 숨겨진 오디오 엘리먼트 */}
            <audio
              ref={audioRef}
              src={recordedAudio ?? undefined}
              className="hidden"
              preload="metadata"
            />
          </div>
        )}
      </div>
    </div>
  );
}
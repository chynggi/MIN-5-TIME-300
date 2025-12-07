'use client';

import { useState, useRef, useEffect } from "react";
import lamejs from "lamejs";
import type { VoiceRecordPayload } from "@/types/diary";

// 간단한 로컬 SVG 아이콘 (외부 패키지 없이 사용)
const MicIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
    <path d="M5 11a1 1 0 1 0-2 0 9 9 0 0 0 8 8.94V22H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.06A9 9 0 0 0 21 11a1 1 0 1 0-2 0 7 7 0 1 1-14 0Z" />
  </svg>
);

const StopIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const PlayIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 5 4.5Z" />
  </svg>
);

const PauseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 5a1 1 0 0 0-1 1v12a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Zm10 0a1 1 0 0 0-1 1v12a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Z" />
  </svg>
);

const RedoIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" />
  </svg>
);

// 원형 진행 게이지 컴포넌트
const CircularProgress = ({ 
  progress, 
  size = 60, 
  strokeWidth = 4 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number; 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-gray-300"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-red-500 transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
};

interface EmotionVoiceProps {
  emotion: string;
  onEmotionChange: (emotion: string) => void;
  onVoiceRecord?: ((payload: VoiceRecordPayload | null) => void);
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
  const [isProcessing, setIsProcessing] = useState(false);

  // 웨이브폼 및 오디오 분석용 refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const rawAudioDataRef = useRef<Float32Array[]>([]);
  const isRecordingRef = useRef(false);

  // 상수
  const MAX_RECORDING_TIME = 120; // 2분 (초)

  // 시간 포맷팅 함수
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 웨이브폼 시각화 함수
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 고해상도 스케일링 (Retina 대응)
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.clientWidth || 200;
    const logicalHeight = canvas.clientHeight || 60;
    if (canvas.width !== logicalWidth * dpr) {
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    const bufferLength = analyser.fftSize; // time domain: use fftSize for smoother line
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Canvas 크기 설정
  const width = logicalWidth;
  const height = logicalHeight;

    // 캔버스 클리어
    ctx.fillStyle = 'rgb(30, 41, 59)'; // slate-800
    ctx.fillRect(0, 0, width, height);

    // 웨이브폼 그리기
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(59, 130, 246)'; // blue-500
    ctx.beginPath();

  const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // 애니메이션 계속
    if (isRecordingRef.current) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  // 침묵 트림 함수
  const trimSilence = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const threshold = 0.01; // 침묵 임계값
    
    // 시작과 끝에서 침묵 부분 찾기
    let start = 0;
    let end = channelData.length - 1;
    
    // 시작 부분 침묵 건너뛰기
    while (start < channelData.length && Math.abs(channelData[start]) < threshold) {
      start++;
    }
    
    // 끝 부분 침묵 건너뛰기
    while (end > start && Math.abs(channelData[end]) < threshold) {
      end--;
    }
    
    // 트림된 길이
    const trimmedLength = end - start + 1;
    
    if (trimmedLength <= 0) {
      // 모든 게 침묵이면 원본 반환
      return audioBuffer;
    }
    
    // 새로운 AudioBuffer 생성
    const trimmedBuffer = new AudioBuffer({
      numberOfChannels: audioBuffer.numberOfChannels,
      length: trimmedLength,
      sampleRate: sampleRate
    });
    
    // 트림된 데이터 복사
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < trimmedLength; i++) {
        trimmedData[i] = originalData[start + i];
      }
    }
    
    return trimmedBuffer;
  };

  const mixToMono = (buffer: AudioBuffer): Float32Array => {
    if (buffer.numberOfChannels === 1) {
      return buffer.getChannelData(0);
    }
    const length = buffer.length;
    const mixed = new Float32Array(length);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        mixed[i] += channelData[i];
      }
    }
    for (let i = 0; i < length; i++) {
      mixed[i] /= buffer.numberOfChannels;
    }	
    return mixed;
  };

  const floatTo16BitPCM = (samples: Float32Array): Int16Array => {
    const buffer = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buffer;
  };

  const audioBufferToMp3 = (buffer: AudioBuffer): Blob => {
    const samples = mixToMono(buffer);
    const mp3encoder = new lamejs.Mp3Encoder(1, buffer.sampleRate, 128);
    const sampleBlockSize = 1152;
    const mp3Data: Int8Array[] = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(floatTo16BitPCM(sampleChunk));
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    return new Blob(
      mp3Data.map(chunk => new Uint8Array(chunk)),
      { type: 'audio/mpeg' }
    );
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      setIsPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      
      // AudioContext 설정 (웨이브폼용)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      // MediaRecorder 설정
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: BlobPart[] = [];
      let startTime = Date.now();
      
      // 원시 오디오 데이터 수집 초기화
      rawAudioDataRef.current = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          // 기본 Blob 생성
          const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          
          // Web Audio API로 처리 (침묵 트림)
          const arrayBuffer = await audioBlob.arrayBuffer();
          if (!audioContextRef.current) {
            throw new Error('AudioContext unavailable');
          }
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          const trimmedBuffer = await trimSilence(audioBuffer);
          const finalBlob = audioBufferToMp3(trimmedBuffer);
          
          const audioUrl = URL.createObjectURL(finalBlob);
          setRecordedAudio(audioUrl);

          // 부모 컴포넌트에 최종 처리된 음성 데이터 전달
          onVoiceRecord?.({
            blob: finalBlob,
            duration: trimmedBuffer.duration,
          });
        } catch (error) {
          console.error('오디오 처리 오류:', error);
          // 처리 실패 시 원본 사용
          const fallbackBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(fallbackBlob);
          let fallbackDuration = recordingDuration;
          try {
            if (audioContextRef.current) {
              const buffer = await audioContextRef.current.decodeAudioData(
                await fallbackBlob.arrayBuffer(),
              );
              fallbackDuration = buffer.duration;
            }
          } catch (decodeError) {
            console.warn('Fallback duration decode failed:', decodeError);
          }
          setRecordedAudio(audioUrl);
          
          onVoiceRecord?.({
            blob: fallbackBlob,
            duration: fallbackDuration,
          });
        } finally {
          setIsProcessing(false);
        }

        // 스트림 및 AudioContext 정리
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        sourceRef.current = null;
      };

      recorder.start();
  setMediaRecorder(recorder);
  setIsRecording(true);
  isRecordingRef.current = true;
      setRecordingDuration(0);

      // 웨이브폼 애니메이션 시작
      drawWaveform();

      // 녹음 시간 업데이트 및 최대 시간 체크
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        
        // 최대 시간 도달 시 자동 중지
        if (elapsed >= MAX_RECORDING_TIME) {
          stopRecording();
        }
      }, 100); // 더 부드러운 업데이트를 위해 100ms로 변경
      
    } catch (error) {
      console.error('녹음 권한 오류:', error);
      setIsPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
  mediaRecorder.stop();
  setIsRecording(false);
  isRecordingRef.current = false;
      setMediaRecorder(null);
      // setRecordingDuration(0); // 녹음 직후 즉시 0으로 리셋하지 않아도 됨 (필요 시 유지)
      
      // 애니메이션 중지
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // 토글 버튼용 핸들러
  const handleRecordButtonClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 기존 녹음을 삭제하고 새로 시작
  const restartRecording = () => {
    if (isRecording) return; // 진행 중이면 무시
    // 이전 녹음 정리
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
    }
    startRecording();
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
    onVoiceRecord?.(null);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
    };
  }, [recordedAudio]);

  return (
    <div className="flex gap-4 items-start mb-6 md:mb-8">
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
              <option key={item.label} value={item.emoji}>
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
                {/* 처리 중 상태 */}
                {isProcessing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="text-blue-600 text-sm text-center">🔄 음성 처리 중...</div>
                  </div>
                )}
                
                {/* 녹음 버튼과 원형 진행 게이지 */}
                <div className="relative w-full">
                  {/* 직사각형 진행 바 (상단 얇은 바) */}
                  {isRecording && (
                    <div className="absolute -top-2 left-0 right-0 h-1 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-150"
                        style={{ width: `${(recordingDuration / MAX_RECORDING_TIME) * 100}%` }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
                    onClick={handleRecordButtonClick}
                    className={`group flex w-full items-center justify-center gap-3 px-5 h-[48px] rounded-lg border-2 text-sm font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isRecording
                        ? 'bg-red-500 border-red-600 text-white shadow'
                        : 'bg-white border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700'
                    } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                    disabled={isProcessing}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-md ${isRecording ? 'bg-red-600/40' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'} transition-colors`}>
                      {isRecording ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                    </span>
                    <span className="pr-1">
                      {isRecording ? `녹음 중... ${formatDuration(recordingDuration)}` : '음성 녹음'}
                    </span>
                    {isRecording && (
                      <span className="absolute inset-0 rounded-lg ring-2 ring-red-400/40 animate-pulse pointer-events-none" />
                    )}
                  </button>
                </div>
                
                {/* 상태 메시지 */}
                {/* 안내 문구 제거 (요청사항) */}
                
                {/* 웨이브폼 시각화 */}
                {isRecording && (
                  <div className="mt-3">
                    <canvas
                      ref={canvasRef}
                      width="200"
                      height="60"
                      className="w-full h-16 bg-slate-800 rounded-md border border-slate-600"
                    />
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>실시간 웨이브폼</span>
                      <span className="text-[10px] text-gray-400">{formatDuration(recordingDuration)}</span>
                    </div>
                  </div>
                )}
                
                {/* 시간 진행 바 */}
                {isRecording && (
                  <div className="w-full bg-gray-200 rounded-md h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-400 h-2 transition-all duration-100"
                      style={{ width: `${(recordingDuration / MAX_RECORDING_TIME) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 녹음된 오디오 컨트롤 */
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 flex items-center gap-1"><MicIcon className="w-4 h-4" /> 음성메시지</span>
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
                aria-label={isPlaying ? "일시정지" : "재생"}
                onClick={isPlaying ? pauseAudio : playAudio}
                className="bg-white border border-blue-300 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500">
                  {isPlaying ? "재생 중..." : "재생 준비됨"}
                </div>
              </div>
              
              <button
                type="button"
                aria-label="다시 녹음"
                onClick={restartRecording}
                className="flex items-center gap-1 bg-white border border-green-400 text-green-600 px-3 py-2 rounded-md text-xs hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1"
              >
                <RedoIcon /> 다시 녹음
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

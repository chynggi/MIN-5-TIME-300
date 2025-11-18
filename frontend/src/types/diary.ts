// Spotify API types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    images: { url: string }[];
  };
}

// Diary types
export interface DiarySettings {
  postVisibility: "private" | "public" | "friends";
  contentVisibility: "public" | "private";
  weather: "sunny" | "cloudy" | "rainy" | "snowy";
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  emotion: string;
  weather: string;
  postVisibility: string;
  contentVisibility: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  voice?: string;
  music?: SpotifyTrack;
  user: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  isOwner: boolean;
  question?: string;
  questionId?: string;
  writingDuration?: number;
  emotionScore?: number;
  reactions?: any[];
}

export interface VoiceRecordPayload {
  blob: Blob;
  duration: number;
}

// Component props types
export interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  preview: string | null;
}

export interface EmotionVoiceProps {
  emotion: string;
  onEmotionChange: (emotion: string) => void;
  onVoiceRecord: (payload: VoiceRecordPayload | null) => void;
}

export interface MusicSettingProps {
  onMusicSelect: (track: SpotifyTrack | null) => void;
  selectedTrack: SpotifyTrack | null;
}

export interface WritingModeProps {
  onModeSelect: (mode: "question" | "free") => void;
}

export interface DiarySettingsProps {
  settings: DiarySettings;
  onSettingsChange: (settings: DiarySettings) => void;
}

export interface AIQuestionWriterProps {
  onComplete: (data: {
    title: string;
    content: string;
    questionId: string;
    questionModel?: string;
    selectedQuestions: Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }>;
  }) => void;
  onBack: () => void;
  initialQuestions?: Array<{ domain: 'emotion' | 'action' | 'relationship' | 'recovery' | 'goal'; text: string }>;
}

export interface FreeWriterProps {
  onComplete: (data: { title: string; content: string }) => void;
  onBack: () => void;
  initialTitle?: string;
  initialContent?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
  isPrivate: boolean; // true: 비공개, false: 공개
  isShared: boolean; // true: 공유됨, false: 공유되지 않음
}

// 프로필 관련 타입 정의
export interface ProfileInterest {
  id: string;
  interest: string;
  priority: number;
}

export interface ProfileResponse {
  id: string;
  email: string;
  username: string;
  mbti: string;
  bio?: string;
  birthDate?: string;
  location?: string;
  profileImageUrl: string;
  interests: ProfileInterest[];
  createdAt: string;
  lifestyle: LifestyleAnswer[];
  activityScore?: number; // 0-100 활동 지수
}

export interface UpdateProfileData {
  username?: string;
  mbti?: string;
  profileImageUrl?: string;
}

export interface UpdateInterestsData {
  interests: Array<{
    interest: string;
    priority: number;
  }>;
}

export interface LifestyleAnswer {
  question: string;
  answer: string;
}

export interface LifestyleAnswerData {
  answers: LifestyleAnswer[];
}

// 친구 관련 타입
export interface Friend {
  id: string;
  user: {
    id: string;
    username: string;
    mbti: string;
    profileImageUrl?: string;
  };
  status: 'pending' | 'accepted';
  createdAt: string;
  updatedAt: string;
}

export interface FriendListResponse {
  friends: Friend[];
  totalCount?: number;
}

export interface FriendRequestData {
  targetUserId: string;
}

export interface FriendRespondData {
  accept: boolean;
}

// 알림 설정 타입
export interface NotificationSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  friendRequestNotification: boolean;
  commentNotification: boolean;
  reactionNotification: boolean;
  messageNotification: boolean;
}

export interface UpdateNotificationSettings {
  reminderEnabled?: boolean;
  reminderTime?: string;
  friendRequestNotification?: boolean;
  commentNotification?: boolean;
  reactionNotification?: boolean;
  messageNotification?: boolean;
}

// 페르소나 & 목표 타입
export interface PersonaAndGoals {
  persona: string;
  goals: string[];
}

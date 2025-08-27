export interface User {
  id: string;
  username: string;
  profileImageUrl?: string;
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  HIDDEN = 'HIDDEN'
}

export enum NotificationType {
  FOLLOW_REQUESTED = 'follow_requested',
  FOLLOW_APPROVED = 'follow_approved',
  FOLLOW_REJECTED = 'follow_rejected',
  FOLLOWED_YOU = 'followed_you',
  JOURNAL_LIKED = 'journal_liked',
  JOURNAL_COMMENTED = 'journal_commented',
  MENTION_CREATED = 'mention_created',
  FRIEND_ACCEPTED = 'friend_accepted',
  DIARY_PUBLISHED = 'diary_published'
}

export interface Notification {
  id: string;
  type: NotificationType;
  actorIds: string[];
  objectType?: string;
  objectId?: string;
  groupKey?: string;
  groupCount: number;
  payload?: any;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  title?: string;
  body?: string;
  deepLink?: string;
  actors?: User[];
}

export interface NotificationQuery {
  limit?: number;
  cursor?: string;
  status?: NotificationStatus;
  onlyUnread?: boolean;
}

export interface NotificationListResponse {
  data: Notification[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface NotificationPrefs {
  channelPush: boolean;
  channelInApp: boolean;
  channelEmail: boolean;
  quietHours?: {
    tz: string;
    from: string;
    to: string;
  };
  types: {
    follow: boolean;
    like: boolean;
    comment: boolean;
    mention: boolean;
    diary: boolean;
  };
  lang: string;
}

export interface DeviceToken {
  token: string;
  platform: string;
  locale?: string;
}

export interface NotificationCounter {
  count: number;
}
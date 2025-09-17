import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, IsUUID, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

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
  , WELLBEING_SEVERE = 'wellbeing_severe'
}

export class CreateNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsJSON()
  actorIds: string[];

  @IsOptional()
  @IsString()
  objectType?: string;

  @IsOptional()
  @IsString()
  objectId?: string;

  @IsOptional()
  @IsString()
  groupKey?: string;

  @IsOptional()
  @IsNumber()
  groupCount?: number;

  @IsOptional()
  @IsJSON()
  payload?: any;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}

export class NotificationQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyUnread?: boolean = false;
}

export class NotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  channelPush?: boolean;

  @IsOptional()
  @IsBoolean()
  channelInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  channelEmail?: boolean;

  @IsOptional()
  @IsJSON()
  quietHours?: any;

  @IsOptional()
  @IsJSON()
  types?: any;

  @IsOptional()
  @IsString()
  lang?: string;
}

export class DeviceTokenDto {
  @IsString()
  token: string;

  @IsString()
  platform: string; // 'ios', 'android', 'web'

  @IsOptional()
  @IsString()
  locale?: string;
}

export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  actorIds: string[];
  objectType?: string;
  objectId?: string;
  groupKey?: string;
  groupCount: number;
  payload?: any;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  
  // 추가 렌더링 정보
  title?: string;
  body?: string;
  deepLink?: string;
  actors?: any[]; // 실제 유저 정보
}
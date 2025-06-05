import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class NotificationSettingsDto {
  @IsBoolean()
  reminderEnabled: boolean;

  @IsString()
  reminderTime: string;

  @IsBoolean()
  friendRequestNotification: boolean;

  @IsBoolean()
  commentNotification: boolean;

  @IsBoolean()
  reactionNotification: boolean;

  @IsBoolean()
  messageNotification: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  reminderTime?: string;

  @IsOptional()
  @IsBoolean()
  friendRequestNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  commentNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  reactionNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  messageNotification?: boolean;
}

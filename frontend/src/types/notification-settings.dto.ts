export interface NotificationSettingsDto {
  reminderEnabled: boolean;
  reminderTime: string;
  friendRequestNotification: boolean;
  commentNotification: boolean;
  reactionNotification: boolean;
  messageNotification: boolean;
}

export interface UpdateNotificationSettingsDto {
  reminderEnabled?: boolean;
  reminderTime?: string;
  friendRequestNotification?: boolean;
  commentNotification?: boolean;
  reactionNotification?: boolean;
  messageNotification?: boolean;
}

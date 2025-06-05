-- AlterTable
ALTER TABLE "NotificationSettings" ADD COLUMN     "commentNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "friendRequestNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reactionNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderTime" TEXT;

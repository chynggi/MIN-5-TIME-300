-- AlterTable
ALTER TABLE "PrivacySettings" ADD COLUMN     "followersVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "followingVisibility" TEXT NOT NULL DEFAULT 'PUBLIC';

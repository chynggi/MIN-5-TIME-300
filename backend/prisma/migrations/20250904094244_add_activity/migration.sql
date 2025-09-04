-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "activityResetAt" TIMESTAMP(3);

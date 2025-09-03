/*
  Warnings:

  - You are about to drop the `CommunityComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommunityComment" DROP CONSTRAINT "CommunityComment_journalId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityComment" DROP CONSTRAINT "CommunityComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackLog" DROP CONSTRAINT "FeedbackLog_commentId_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackLog" DROP CONSTRAINT "FeedbackLog_journalId_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackLog" DROP CONSTRAINT "FeedbackLog_userId_fkey";

-- DropTable
DROP TABLE "CommunityComment";

-- DropTable
DROP TABLE "FeedbackLog";

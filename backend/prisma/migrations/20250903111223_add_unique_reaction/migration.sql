/*
  Warnings:

  - A unique constraint covering the columns `[journalId,userId,reactionType]` on the table `JournalReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "JournalReaction_journalId_userId_reactionType_key" ON "JournalReaction"("journalId", "userId", "reactionType");

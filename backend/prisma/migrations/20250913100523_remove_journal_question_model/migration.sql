/*
  Warnings:

  - You are about to drop the `JournalQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JournalQuestion" DROP CONSTRAINT "JournalQuestion_journalId_fkey";

-- DropTable
DROP TABLE "JournalQuestion";

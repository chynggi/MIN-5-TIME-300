-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "summaryFallbackUsed" BOOLEAN DEFAULT false,
ADD COLUMN     "summaryModel" TEXT,
ADD COLUMN     "summaryTruncated" BOOLEAN DEFAULT false;

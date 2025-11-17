-- AlterTable
ALTER TABLE "Journal"
    ADD COLUMN "postVisibility" TEXT NOT NULL DEFAULT 'public',
    ADD COLUMN "contentVisibility" TEXT NOT NULL DEFAULT 'public',
    ADD COLUMN "weather" TEXT NOT NULL DEFAULT 'sunny';

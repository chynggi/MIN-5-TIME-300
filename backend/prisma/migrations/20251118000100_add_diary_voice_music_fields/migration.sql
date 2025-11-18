-- Add diary voice attachment and spotify music metadata columns
ALTER TABLE "Journal"
  ADD COLUMN "voiceUrl" TEXT,
  ADD COLUMN "voiceMime" TEXT,
  ADD COLUMN "voiceDuration" INTEGER,
  ADD COLUMN "music" JSONB;

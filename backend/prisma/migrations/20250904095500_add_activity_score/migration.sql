-- Add activity score fields to User
ALTER TABLE "User" 
  ADD COLUMN "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "activityLevel" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastActivityDecayAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "AdviceRiskFlag" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE');

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalId" TEXT,
    "diaryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood_1to10" INTEGER NOT NULL,
    "energy_1to10" INTEGER NOT NULL,
    "stress_1to10" INTEGER NOT NULL,
    "sleep_hours_1to9p" INTEGER NOT NULL,
    "sleep_quality_1to10" INTEGER NOT NULL,
    "activity_types" TEXT[],
    "workout_intensity_1to10" INTEGER NOT NULL DEFAULT 0,
    "focus_1to10" INTEGER NOT NULL,
    "fatigue_1to10" INTEGER NOT NULL,
    "social_count_1to10" INTEGER NOT NULL,
    "social_satisfaction_1to10" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBaselineCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood_1to10" INTEGER NOT NULL,
    "energy_1to10" INTEGER NOT NULL,
    "stress_1to10" INTEGER NOT NULL,
    "sleep_hours_1to9p" INTEGER NOT NULL,
    "sleep_quality_1to10" INTEGER NOT NULL,
    "activity_types" TEXT[],
    "workout_intensity_1to10" INTEGER NOT NULL DEFAULT 0,
    "focus_1to10" INTEGER NOT NULL,
    "fatigue_1to10" INTEGER NOT NULL,
    "social_count_1to10" INTEGER NOT NULL,
    "social_satisfaction_1to10" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBaselineCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "tags" TEXT[],
    "risk" "AdviceRiskFlag" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdviceFeedback" (
    "id" TEXT NOT NULL,
    "adviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdviceFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCheckin_userId_diaryDate_idx" ON "DailyCheckin"("userId", "diaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_userId_diaryDate_key" ON "DailyCheckin"("userId", "diaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_journalId_key" ON "DailyCheckin"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBaselineCheckin_userId_key" ON "UserBaselineCheckin"("userId");

-- CreateIndex
CREATE INDEX "Advice_userId_createdAt_idx" ON "Advice"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdviceFeedback_userId_createdAt_idx" ON "AdviceFeedback"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdviceFeedback_adviceId_userId_key" ON "AdviceFeedback"("adviceId", "userId");

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBaselineCheckin" ADD CONSTRAINT "UserBaselineCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advice" ADD CONSTRAINT "Advice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdviceFeedback" ADD CONSTRAINT "AdviceFeedback_adviceId_fkey" FOREIGN KEY ("adviceId") REFERENCES "Advice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdviceFeedback" ADD CONSTRAINT "AdviceFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

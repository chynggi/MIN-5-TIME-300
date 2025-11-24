-- CreateTable
CREATE TABLE "DailyQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "questions" JSONB NOT NULL,
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyQuestion_userId_date_idx" ON "DailyQuestion"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestion_userId_date_key" ON "DailyQuestion"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyQuestion" ADD CONSTRAINT "DailyQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

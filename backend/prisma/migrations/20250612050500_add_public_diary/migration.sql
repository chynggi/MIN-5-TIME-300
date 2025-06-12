-- CreateTable
CREATE TABLE "PublicDiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "writingDuration" INTEGER NOT NULL,

    CONSTRAINT "PublicDiary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PublicDiary" ADD CONSTRAINT "PublicDiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

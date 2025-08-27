-- AlterTable
ALTER TABLE "Follow" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Follow_followerId_status_isFavorite_idx" ON "Follow"("followerId", "status", "isFavorite");

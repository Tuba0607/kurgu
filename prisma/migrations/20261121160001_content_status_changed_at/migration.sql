-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "contents_status_status_changed_at_idx" ON "contents"("status", "status_changed_at");

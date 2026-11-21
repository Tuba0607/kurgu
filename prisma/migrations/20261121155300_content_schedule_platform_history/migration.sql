-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'X', 'FACEBOOK');

-- DropForeignKey
ALTER TABLE "contents" DROP CONSTRAINT "contents_client_id_fkey";

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "platform" "SocialPlatform",
ADD COLUMN     "scheduled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "content_status_changes" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "from_status" "ContentStatus",
    "to_status" "ContentStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_status_changes_content_id_changed_at_idx" ON "content_status_changes"("content_id", "changed_at");

-- CreateIndex
CREATE INDEX "contents_scheduled_at_idx" ON "contents"("scheduled_at");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_status_changes" ADD CONSTRAINT "content_status_changes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `asin` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Campaign" DROP CONSTRAINT "Campaign_marketplaceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FeedbackSubmission" DROP CONSTRAINT "FeedbackSubmission_campaignId_fkey";

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "asin" VARCHAR(10) NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "marketplaceId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."ReviewOpenEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asin" TEXT NOT NULL,
    "productName" TEXT,
    "campaignId" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "ReviewOpenEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewOpenEvent_asin_createdAt_idx" ON "public"."ReviewOpenEvent"("asin", "createdAt");

-- CreateIndex
CREATE INDEX "Campaign_asin_idx" ON "public"."Campaign"("asin");

-- AddForeignKey
ALTER TABLE "public"."ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "public"."Marketplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewOpenEvent" ADD CONSTRAINT "ReviewOpenEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

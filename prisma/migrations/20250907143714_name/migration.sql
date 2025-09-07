-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('AMAZON', 'EBAY', 'GOOGLE', 'SHOPIFY', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."Marketplace" (
    "id" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "code" TEXT NOT NULL,
    "tld" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "marketplaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewTarget" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "asin" TEXT,
    "itemId" TEXT,
    "placeId" TEXT,
    "url" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShortLink" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScanEvent" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "public"."Campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "public"."ShortLink"("slug");

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "public"."Marketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewTarget" ADD CONSTRAINT "ReviewTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShortLink" ADD CONSTRAINT "ShortLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScanEvent" ADD CONSTRAINT "ScanEvent_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "public"."ShortLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

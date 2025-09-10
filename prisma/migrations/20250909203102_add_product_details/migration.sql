-- CreateTable
CREATE TABLE "public"."ReviewSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "marketplace" JSONB NOT NULL,
    "rating" INTEGER NOT NULL,
    "used7Days" BOOLEAN NOT NULL,
    "reviewText" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "email" VARCHAR(320),
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "productName" TEXT NOT NULL,
    "targetId" TEXT,
    "target" JSONB,

    CONSTRAINT "ReviewSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSubmission_campaignId_orderNumber_key" ON "public"."ReviewSubmission"("campaignId", "orderNumber");

-- AddForeignKey
ALTER TABLE "public"."ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."ReviewTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."FeedbackSubmission" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "product" TEXT,
    "marketplace" TEXT,
    "orderNumber" TEXT,
    "rating" INTEGER,
    "used7Days" BOOLEAN,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "optIn" BOOLEAN,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

// src/app/api/dev/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Platform, Prisma } from "@prisma/client";

// Optional: disable this route in production
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { ok: false, message: "Disabled in production" },
      { status: 403 }
    );
  }

  // 1) Marketplace (idempotent)
  const marketplace = await prisma.marketplace.upsert({
    where: { id: "mkt-amazon-uk" },
    update: {},
    create: {
      id: "mkt-amazon-uk",
      platform: Platform.AMAZON,
      code: "UK",
      tld: "co.uk",
      externalId: "SELLER_ID_OPTIONAL",
    },
  });

  // 2) Campaign (idempotent; assumes unique slug)
  const campaign = await prisma.campaign.upsert({
    where: { slug: "amz-uk-sept" },
    update: {},
    create: {
      id: "camp-amz-uk-sept",
      name: "Amazon UK – Sept",
      slug: "amz-uk-sept",
      marketplace: { connect: { id: marketplace.id } },
    },
  });

  // 3) Review target (idempotent) — NOTE: title is REQUIRED by your schema
  const targetCreate: Prisma.ReviewTargetCreateInput = {
    id: "seed-target",
    title: "Amazon Product B0XXXXXXX", // ✅ required
    image: "https://images-na.ssl-images-amazon.com/images/P/B0XXXXXXX.jpg", // optional if your model allows
    platform: Platform.AMAZON, // ✅ enum, not string
    asin: "B0XXXXXXX",
    isPrimary: true,
    campaign: { connect: { id: campaign.id } },
  };

  await prisma.reviewTarget.upsert({
    where: { id: targetCreate.id },
    update: targetCreate,
    create: targetCreate,
  });

  // 4) Short link (idempotent; assumes unique slug)
  await prisma.shortLink.upsert({
    where: { slug: "amz-sept-1" },
    update: { campaignId: campaign.id },
    create: {
      id: "short-amz-sept-1",
      slug: "amz-sept-1",
      campaign: { connect: { id: campaign.id } },
    },
  });

  return NextResponse.json({ ok: true, campaignId: campaign.id });
}

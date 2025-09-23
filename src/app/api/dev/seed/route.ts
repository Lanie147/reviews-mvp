// src/app/api/dev/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Platform, Prisma } from "@prisma/client";

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
      code: "UK", // keep your current code schema
      tld: "co.uk",
      externalId: "SELLER_ID_OPTIONAL",
    },
  });

  // 2) Campaign (idempotent; now includes required fields)
  // NOTE: ASIN must be 10 chars
  const seedAsin = "B0ABCDE123"; // 10 characters

  const campaign = await prisma.campaign.upsert({
    where: { slug: "amz-uk-sept" },
    update: {
      // keep idempotent but allow updates if you tweak seed data later
      name: "Amazon UK – Sept",
      productName: "Example Product",
      asin: seedAsin.toUpperCase(),
      imageUrl: "https://via.placeholder.com/600x600.png?text=Example+Product",
      marketplace: { connect: { id: marketplace.id } },
    },
    create: {
      id: "camp-amz-uk-sept",
      name: "Amazon UK – Sept",
      productName: "Example Product",
      asin: seedAsin.toUpperCase(),
      imageUrl: "https://via.placeholder.com/600x600.png?text=Example+Product",
      slug: "amz-uk-sept",
      marketplace: { connect: { id: marketplace.id } }, // required relation
    },
  });

  // 3) Review target (idempotent) — title required by your schema
  const targetCreate: Prisma.ReviewTargetCreateInput = {
    id: "seed-target",
    title: "Amazon Product " + seedAsin, // required
    image: "https://via.placeholder.com/1200x1200.png?text=Review+Target",
    platform: Platform.AMAZON,
    asin: seedAsin,
    isPrimary: true,
    campaign: { connect: { id: campaign.id } },
  };

  await prisma.reviewTarget.upsert({
    where: { id: targetCreate.id },
    update: targetCreate,
    create: targetCreate,
  });

  // 4) Short link (idempotent; unique slug)
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

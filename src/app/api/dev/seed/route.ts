// src/app/api/dev/seed/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform } from "@prisma/client";

export async function GET() {
  // <— no arg
  const ok =
    process.env.NODE_ENV !== "production" || process.env.SEED_TOKEN === "allow";
  if (!ok) return new NextResponse("forbidden", { status: 403 });

  const mkt = await db.marketplace.upsert({
    where: { id: "seed-amazon-uk" },
    update: {},
    create: {
      id: "seed-amazon-uk",
      platform: Platform.AMAZON,
      code: "UK",
      tld: "co.uk",
      externalId: "SELLER_ID_OPTIONAL",
    },
  });

  const campaign = await db.campaign.upsert({
    where: { slug: "amz-uk-sept" },
    update: {},
    create: {
      name: "Amazon UK – Sept",
      slug: "amz-uk-sept",
      marketplace: { connect: { id: mkt.id } },
    },
  });

  await db.reviewTarget.upsert({
    where: { id: "seed-target" },
    update: {},
    create: {
      id: "seed-target",
      campaign: { connect: { id: campaign.id } },
      platform: Platform.AMAZON,
      asin: "B0TESTASIN",
      isPrimary: true,
    },
  });

  await db.shortLink.upsert({
    where: { slug: "amz-sept-1" },
    update: {},
    create: {
      campaign: { connect: { id: campaign.id } },
      slug: "amz-sept-1",
    },
  });

  return NextResponse.json({ ok: true });
}

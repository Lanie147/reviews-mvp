// src/app/c/[slug]/route.ts
import { db } from "@/lib/db";
import { buildReviewUrl } from "@/lib/reviewLink";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const short = await db.shortLink.findUnique({
    where: { slug: params.slug },
    include: {
      campaign: { include: { targets: true, marketplace: true } },
    },
  });

  if (!short) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  // capture headers
  const ua = req.headers.get("user-agent") ?? undefined;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex");

  // log scan
  await db.scanEvent.create({
    data: {
      shortLinkId: short.id,
      userAgent: ua,
      ipHash,
    },
  });

  // resolve redirect
  const tld = short.campaign.marketplace?.tld ?? "co.uk";
  const targets = short.campaign.targets;

  if (targets.length === 1) {
    const t = targets[0];
    const dest = buildReviewUrl({
      platform: t.platform,
      asin: t.asin ?? undefined,
      itemId: t.itemId ?? undefined,
      placeId: t.placeId ?? undefined,
      url: t.url ?? undefined,
      tld,
    });

    if (dest) {
      return NextResponse.redirect(dest, 302);
    }
  }

  // if multiple or no valid URL → go to landing page
  const landing = new URL(
    `/r/${short.campaign.slug}`,
    process.env.NEXT_PUBLIC_BASE_URL || req.url
  );
  return NextResponse.redirect(landing, 302);
}

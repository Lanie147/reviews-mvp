// src/app/c/[slug]/route.ts
export const runtime = "nodejs";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const short = await db.shortLink.findUnique({
    where: { slug },
    include: { campaign: true },
  });
  if (!short) return NextResponse.redirect(new URL("/", req.url), 302);

  const ua = req.headers.get("user-agent") ?? undefined;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex");
  await db.scanEvent.create({
    data: { shortLinkId: short.id, userAgent: ua, ipHash },
  });

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  return NextResponse.redirect(
    new URL(`/r/${short.campaign.slug}`, origin),
    302
  );
}

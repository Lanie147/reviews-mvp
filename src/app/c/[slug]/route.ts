// src/app/c/[slug]/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> } // keep as Promise to satisfy Next's async params requirement
) {
  const { slug } = await ctx.params;

  // We only need the shortLink id for scan logging now
  const short = await prisma.shortLink.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!short) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  // Log scan (hashed IP + UA)
  const ua = req.headers.get("user-agent") ?? undefined;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex");

  await prisma.scanEvent.create({
    data: { id: crypto.randomUUID(), shortLinkId: short.id, userAgent: ua, ipHash },
  });

  // Always redirect to the generic landing
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  return NextResponse.redirect(new URL("/r", origin), 302);
}

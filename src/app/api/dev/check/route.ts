// src/app/api/dev/check/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const counts = {
      marketplaces: await prisma.marketplace.count(),
      campaigns: await prisma.campaign.count(),
      targets: await prisma.reviewTarget.count(),
      links: await prisma.shortLink.count(),
    };
    return NextResponse.json({ ok: true, counts });
  } catch (e: unknown) {
    // <— was: any
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

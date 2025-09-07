// src/app/api/dev/check/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const counts = {
      marketplaces: await db.marketplace.count(),
      campaigns: await db.campaign.count(),
      targets: await db.reviewTarget.count(),
      links: await db.shortLink.count(),
    };
    return NextResponse.json({ ok: true, counts });
  } catch (e: unknown) {
    // <— was: any
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

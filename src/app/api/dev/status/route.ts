// src/app/api/dev/status/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || "";
    const host = url.split("@")[1]?.split("/")[0] || "";
    const counts = {
      marketplaces: await db.marketplace.count(),
      campaigns: await db.campaign.count(),
      targets: await db.reviewTarget.count(),
      links: await db.shortLink.count(),
    };
    return NextResponse.json({
      ok: true,
      env: process.env.NODE_ENV,
      dbUrlPresent: !!process.env.DATABASE_URL,
      dbHost: host, // e.g. aws-0-xxx.pooler.supabase.com:6543
      counts,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

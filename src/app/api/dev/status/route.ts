// src/app/api/dev/status/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || "";
    const host = url.split("@")[1]?.split("/")[0] || "";
    const counts = {
      marketplaces: await prisma.marketplace.count(),
      campaigns: await prisma.campaign.count(),
      targets: await prisma.reviewTarget.count(),
      links: await prisma.shortLink.count(),
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

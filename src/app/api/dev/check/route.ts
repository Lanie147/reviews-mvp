export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await db.campaign.count();
    const targets = await db.reviewTarget.count();
    const links = await db.shortLink.count();
    const marketplaces = await db.marketplace.count();

    return NextResponse.json({
      ok: true,
      counts: { campaigns, targets, links, marketplaces },
      dbUrlPresent: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? String(e),
        dbUrlPresent: !!process.env.DATABASE_URL,
      },
      { status: 500 }
    );
  }
}

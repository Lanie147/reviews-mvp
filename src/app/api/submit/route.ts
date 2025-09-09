// src/app/api/submit/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.campaignId) {
      return NextResponse.json(
        { ok: false, error: "campaignId required" },
        { status: 400 }
      );
    }
    await db.feedbackSubmission.create({ data: body });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

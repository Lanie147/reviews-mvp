export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignId,
      product,
      marketplace,
      orderNumber,
      rating,
      used7Days,
      name,
      email,
      phone,
      optIn,
      reviewText,
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "campaignId required" },
        { status: 400 }
      );
    }

    await db.feedbackSubmission.create({
      data: {
        campaignId,
        product,
        marketplace,
        orderNumber,
        rating,
        used7Days,
        name,
        email,
        phone,
        optIn,
        reviewText,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

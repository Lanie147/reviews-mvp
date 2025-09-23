export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  asin: z.string().min(1),
  productName: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = Body.parse(raw);

    // If campaignId is present, check it exists
    if (data.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: data.campaignId },
        select: { id: true },
      });
      if (!campaign) {
        return NextResponse.json(
          {
            ok: false,
            error: "Campaign not found for the provided campaignId.",
          },
          { status: 400 }
        );
      }
    }

    const ua = req.headers.get("user-agent") ?? null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";
    const crypto = await import("crypto");
    const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex");

    await prisma.reviewOpenEvent.create({
      data: {
        asin: data.asin,
        productName: data.productName ?? null,
        campaignId: data.campaignId ?? null,
        userAgent: ua,
        ipHash,
      },
    });

    // 201 Created
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("review-pen error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asin = searchParams.get("asin");
  if (!asin) {
    return NextResponse.json(
      { ok: false, error: "asin required" },
      { status: 400 }
    );
  }

  // optional extras
  const productName = searchParams.get("productName");
  const campaignId = searchParams.get("campaignId");

  const ipHash = crypto
    .createHash("sha256")
    .update(
      `${req.headers.get("x-forwarded-for") ?? ""}|${
        req.headers.get("user-agent") ?? ""
      }`
    )
    .digest("hex");

  await prisma.reviewOpenEvent.create({
    data: { asin, productName, campaignId, ipHash },
  });

  // 1x1 gif response (pixel) or just 204
  return new Response(null, { status: 204 });
}

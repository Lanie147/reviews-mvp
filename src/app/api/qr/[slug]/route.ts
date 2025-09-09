import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  // robust origin
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  const target = `${origin}/c/${slug}`;

  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}

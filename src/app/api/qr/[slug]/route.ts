export const runtime = "nodejs";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const short = await db.shortLink.findUnique({ where: { slug } });
  if (!short) return new NextResponse("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const target = `${base}/c/${slug}`;

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

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const short = await db.shortLink.findUnique({ where: { slug: params.slug } });
  if (!short) return new NextResponse("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const target = `${base}/c/${params.slug}`;
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

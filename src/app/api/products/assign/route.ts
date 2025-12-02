import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  productIds: z.array(z.string()).min(1),
  campaignId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = Body.parse(raw);
    await prisma.product.updateMany({
      where: { id: { in: data.productIds } },
      data: { campaignId: data.campaignId ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("assign products error", err);
    if (err?.name === "ZodError") {
      return NextResponse.json({ ok: false, error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
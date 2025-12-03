// Language: ts
// File: src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const CreateBody = z.object({
  externalIds: z.string().min(1),
  title: z.string().nullable().optional(),
  marketplaceId: z.string().nullable().optional(),
  campaignId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = CreateBody.parse(raw);

    const ids = data.externalIds
      .split(/[\n,;,]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ ok: false, error: "no ids provided" }, { status: 400 });
    }

    const rows = ids.map((externalId: string) => ({
      id: randomUUID(),
      externalId,
      title: data.title ?? null,
      marketplaceId: data.marketplaceId ?? null,
      campaignId: data.campaignId ?? null,
    }));

    await prisma.product.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, created: rows.length }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ ok: false, error: (err as z.ZodError).issues }, { status: 400 });
    }
    console.error("create products error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" as const },
    take: 1000,
  });
  return NextResponse.json({ ok: true, products });
}
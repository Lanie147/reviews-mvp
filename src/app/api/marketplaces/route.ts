// Language: ts
// File: src/app/api/marketplaces/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.marketplace.findMany({
    orderBy: { createdAt: "asc" as const },
    select: { id: true, code: true, platform: true, tld: true },
  });
  return NextResponse.json({ ok: true, items });
}
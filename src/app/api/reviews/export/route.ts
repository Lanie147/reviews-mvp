// src/app/api/reviews/export/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Ensure this is a pure route handler response (no caching / no RSC)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Escape a CSV cell */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

/** Flatten common marketplace JSON fields */
function flattenMarketplace(mp: Prisma.JsonValue | null): {
  marketplacePlatform: string;
  marketplaceCode: string;
  marketplaceDomain: string;
} {
  if (!mp || typeof mp !== "object") {
    return {
      marketplacePlatform: "",
      marketplaceCode: "",
      marketplaceDomain: "",
    };
  }
  const obj = mp as Record<string, unknown>;
  const platform =
    (typeof obj.platform === "string" && obj.platform) ||
    (typeof obj.name === "string" && obj.name) ||
    "";
  const code =
    (typeof obj.code === "string" && obj.code) ||
    (typeof obj.country === "string" && obj.country) ||
    "";
  const domain =
    (typeof obj.domain === "string" && obj.domain) ||
    (typeof obj.host === "string" && obj.host) ||
    "";
  return {
    marketplacePlatform: platform,
    marketplaceCode: code,
    marketplaceDomain: domain,
  };
}

export async function GET(req: NextRequest) {
  // Gate behind sign-in (adjust/remove if you want it public)
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);

  // Optional filters
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to = url.searchParams.get("to"); // YYYY-MM-DD
  const campaignId = url.searchParams.get("campaignId"); // export single campaign
  const minRating = url.searchParams.get("minRating");
  const maxRating = url.searchParams.get("maxRating");
  const used7 = url.searchParams.get("used7Days"); // "true" | "false"

  const minRatingNum = minRating !== null ? Number(minRating) : undefined;
  const maxRatingNum = maxRating !== null ? Number(maxRating) : undefined;

  const where: Prisma.ReviewSubmissionWhereInput = {
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(campaignId ? { campaignId } : {}),
    ...(minRatingNum !== undefined || maxRatingNum !== undefined
      ? {
          rating: {
            ...(minRatingNum !== undefined ? { gte: minRatingNum } : {}),
            ...(maxRatingNum !== undefined ? { lte: maxRatingNum } : {}),
          },
        }
      : {}),
    ...(used7 === "true"
      ? { used7Days: true }
      : used7 === "false"
      ? { used7Days: false }
      : {}),
  };

  const submissions = await prisma.reviewSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      campaignId: true,
      campaignName: true,
      marketplace: true, // JSON
      rating: true,
      used7Days: true,
      reviewText: true,
      orderNumber: true,
      email: true,
      marketingOptIn: true,
      productName: true,
      targetId: true,
    },
  });

  const header = [
    "submittedAt",
    "campaignId",
    "campaignName",
    "productName",
    "orderNumber",
    "rating",
    "used7Days",
    "email",
    "marketingOptIn",
    "marketplacePlatform",
    "marketplaceCode",
    "marketplaceDomain",
    "targetId",
    "reviewText",
  ] as const;

  const rows: string[][] = submissions.map((s) => {
    const m = flattenMarketplace(s.marketplace as Prisma.JsonValue | null);
    return [
      s.createdAt.toISOString(),
      s.campaignId,
      s.campaignName,
      s.productName,
      s.orderNumber,
      String(s.rating),
      s.used7Days ? "true" : "false",
      s.email ?? "",
      s.marketingOptIn ? "true" : "false",
      m.marketplacePlatform,
      m.marketplaceCode,
      m.marketplaceDomain,
      s.targetId ?? "",
      s.reviewText,
    ];
  });

  const body =
    "\uFEFF" +
    [header as unknown as string[], ...rows]
      .map((r) => r.map(csvCell).join(","))
      .join("\n");

  const nameBits: string[] = [];
  if (campaignId) nameBits.push(campaignId);
  if (from || to) nameBits.push(`${from ?? "all"}-to-${to ?? "now"}`);
  const filename = `reviews${
    nameBits.length ? "-" + nameBits.join("_") : ""
  }-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

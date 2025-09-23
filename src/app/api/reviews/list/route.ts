import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if your prisma helper differs
import { Prisma } from "@prisma/client";

// Shape here matches ReviewsResponse in the client component
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
  );
  const q = (searchParams.get("q") || "").trim();
  const product = searchParams.get("product") || "ALL";
  const ratings = (searchParams.get("ratings") || "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 5);

  const where: Prisma.ReviewSubmissionWhereInput = {};

  if (q) {
    where.OR = [
      { reviewText: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { orderNumber: { contains: q, mode: "insensitive" } },
      { productName: { contains: q, mode: "insensitive" } },
      { campaignName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (product && product !== "ALL") {
    // We filter by productName; switch to productId/asin if you store that
    where.productName = { equals: product };
  }

  if (ratings.length) {
    where.rating = { in: ratings };
  }
  const [total, rowsRaw, distinctProducts] = await Promise.all([
    prisma.reviewSubmission.count({ where }),
    prisma.reviewSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        campaignId: true,
        campaignName: true,
        productName: true,
        rating: true,
        reviewText: true,
        email: true,
        used7Days: true,
        orderNumber: true,
      },
    }),
    prisma.reviewSubmission.findMany({
      where: {},
      select: { productName: true },
      distinct: ["productName"],
      orderBy: { productName: "asc" },
    }),
  ]);

  const rows = rowsRaw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const products = distinctProducts
    .map((p) => p.productName)
    .filter(Boolean)
    .map((name) => ({ value: String(name), label: String(name) }));

  return NextResponse.json({ rows, total, products });
}

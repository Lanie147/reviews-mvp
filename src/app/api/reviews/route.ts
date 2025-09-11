import { NextResponse } from "next/server";
import { reviewSubmissionSchema } from "@/lib/validation/review";
import { prisma } from "@/lib/prisma"; // ensure this exists; create if needed
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reviewSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return NextResponse.json({ ok: false, errors: issues }, { status: 422 });
    }

    const data = parsed.data;

    // Ensure campaign exists (tweak to your model)
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json(
        {
          ok: false,
          errors: [{ path: "campaignId", message: "Campaign not found" }],
        },
        { status: 404 }
      );
    }

    // Block duplicates per (campaignId, orderNumber)
    const existing = await prisma.reviewSubmission.findUnique({
      where: {
        campaignId_orderNumber: {
          campaignId: data.campaignId,
          orderNumber: data.orderNumber,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            {
              path: "orderNumber",
              message: "This order is already submitted for this campaign.",
            },
          ],
        },
        { status: 409 }
      );
    }

    // Save
    const created = await prisma.reviewSubmission.create({ data });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

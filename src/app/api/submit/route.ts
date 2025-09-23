// src/app/api/submit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const MarketplaceSchema = z
  .object({
    code: z.string(),
    platform: z.string(),
    tld: z.string().optional(),
  })
  .strict();

const BodySchema = z
  .object({
    campaignId: z.string(),
    campaignName: z.string(), // snapshot you store on submission
    productName: z.string(),
    marketplace: MarketplaceSchema, // required JSON in your model
    rating: z.number().int().min(1).max(5),
    used7Days: z.boolean(),
    reviewText: z.string().min(40),
    orderNumber: z.string(),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase().trim() : v),
      z.string().email().nullable().optional()
    ),
    marketingOptIn: z.boolean(),
    targetId: z.string().optional(),
    targetSnapshot: z.unknown().optional(),
  })
  .strict();

type Body = z.infer<typeof BodySchema>;

export async function POST(req: Request) {
  try {
    const json = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const body: Body = parsed.data;

    // 1) Verify the campaign exists in THIS database
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: { id: true, name: true },
    });
    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found for the provided campaignId." },
        { status: 400 }
      );
    }

    // 2) Optional: verify target exists before connect (avoids a second P2025)
    if (body.targetId) {
      const targetExists = await prisma.reviewTarget.findUnique({
        where: { id: body.targetId },
        select: { id: true },
      });
      if (!targetExists) {
        return NextResponse.json(
          { ok: false, error: "Target not found for the provided targetId." },
          { status: 400 }
        );
      }
    }

    // 3) Prepare Prisma JSON fields
    const marketplaceJson = body.marketplace as Prisma.InputJsonValue;

    let snapshot:
      | Prisma.InputJsonValue
      | Prisma.NullableJsonNullValueInput
      | undefined;
    if (body.targetSnapshot === undefined) {
      snapshot = undefined;
    } else if (body.targetSnapshot === null) {
      snapshot = Prisma.JsonNull; // JSON null
    } else {
      snapshot = body.targetSnapshot as Prisma.InputJsonValue;
    }

    // 4) Create the submission (now safe to connect)
    const submission = await prisma.reviewSubmission.create({
      data: {
        campaign: { connect: { id: campaign.id } },
        campaignName: campaign.name, // keep your snapshot, or use campaign.name
        marketplace: marketplaceJson,
        rating: body.rating,
        used7Days: body.used7Days,
        reviewText: body.reviewText,
        orderNumber: body.orderNumber,
        email: body.email ?? null,
        marketingOptIn: body.marketingOptIn,
        productName: body.productName ?? campaign.name,
        ...(body.targetId
          ? { target: { connect: { id: body.targetId } } }
          : {}),
        ...(snapshot !== undefined ? { targetSnapshot: snapshot } : {}),
      } satisfies Prisma.ReviewSubmissionCreateInput,
    });

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          {
            ok: false,
            error: "Order number already submitted for this campaign.",
          },
          { status: 409 }
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json(
          {
            ok: false,
            error: "Related record not found (campaign/target). Check IDs.",
          },
          { status: 400 }
        );
      }
    }
    console.error("submit error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit review." },
      { status: 500 }
    );
  }
}

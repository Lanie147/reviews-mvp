// src/app/r/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ReviewWizard from "@/components/ReviewWizard";
import type { ProductOption } from "@/components/reviews/steps/StepProductOrder";
import type { CampaignProps } from "@/lib/review-helpers";

export default async function GenericLanding() {
  // Pull ASINs from ACTIVE (non-archived) campaigns only
  const rows = await prisma.campaign.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { asin: true, productName: true, imageUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Build de-duped product options keyed by ASIN, ignore empty
  const byAsin = new Map<string, ProductOption>();
  for (const r of rows) {
    const asin = (r.asin ?? "").trim();
    if (!asin) continue;
    if (!byAsin.has(asin)) {
      byAsin.set(asin, {
        id: asin,
        name: asin, // we render only ASIN in the Select
        asin,
        imageUrl: r.imageUrl ?? null,
      });
    }
  }

  const productOptions = Array.from(byAsin.values());

  // Minimal "virtual" campaign for the wizard (Amazon-only flow)
  const campaign: CampaignProps = {
    id: "campaign-global",
    name: "Review Gift",
    productName: "Select a product",
    asin: null,
    imageUrl: null,
    slug: "global",
    status: "ACTIVE",
    marketplace: { platform: "AMAZON", code: "UK", tld: "co.uk" },
    reviewTargets: [],
  };

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <ReviewWizard campaign={campaign} productOptions={productOptions} />
    </main>
  );
}

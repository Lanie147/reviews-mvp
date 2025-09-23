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
    select: {
      id: true, // 👈 include the real campaign id
      asin: true,
      productName: true,
      imageUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Build options for the product picker.
  // IMPORTANT: id here is the REAL campaign id (used on submit).
  const productOptions: ProductOption[] = rows
    .filter((r) => r.asin) // only keep campaigns that have an ASIN
    .map((r) => ({
      id: r.id, // 👈 real campaign id
      name: r.productName ?? "(Unnamed)", // 👈 ProductOption requires 'name'
      asin: r.asin!, // safe because of filter above
      imageUrl: r.imageUrl ?? null,
    }));

  // Synthetic campaign object for rendering the wizard at /r
  // (Submit will use campaign.id ?? form.product?.id, so this can omit an id)
  const campaign: CampaignProps = {
    id: "", // <- dummy/falsy id to satisfy types
    name: "Leave a Review",
    productName: "Choose your product",
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

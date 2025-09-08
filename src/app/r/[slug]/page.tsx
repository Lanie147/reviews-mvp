export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { buildReviewUrl } from "@/lib/reviewLink";
import ReviewWizard from "@/components/ReviewWizard";

export default async function Landing({
  params,
}: {
  params: { slug: string };
}) {
  const campaign = await db.campaign.findUnique({
    where: { slug: params.slug },
    include: { marketplace: true, targets: true },
  });

  if (!campaign) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Campaign not found</h1>
      </main>
    );
  }

  // pick primary target (Amazon for now)
  const t = campaign.targets.find((t) => t.isPrimary) ?? campaign.targets[0];
  const tld = campaign.marketplace?.tld ?? "co.uk";
  const amazonUrl =
    t &&
    buildReviewUrl({
      platform: t.platform,
      asin: t.asin ?? undefined,
      tld,
    });

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <ReviewWizard
        campaign={{
          id: campaign.id,
          name: campaign.name,
          amazonUrl: amazonUrl ?? "",
          marketplaceLabel: `${campaign.marketplace?.platform ?? ""} ${
            campaign.marketplace?.code ?? ""
          }`,
        }}
      />
    </main>
  );
}

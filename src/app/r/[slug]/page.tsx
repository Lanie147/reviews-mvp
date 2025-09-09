// src/app/r/[slug]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
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

  // choose primary target (Amazon for now)
  const t = campaign.targets.find((x) => x.isPrimary) ?? campaign.targets[0];

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <ReviewWizard
        campaign={{
          id: campaign.id,
          name: campaign.name,
          marketplace: {
            platform: campaign.marketplace?.platform ?? "AMAZON",
            code: campaign.marketplace?.code ?? "UK",
            tld: campaign.marketplace?.tld ?? "co.uk",
          },
          target: t
            ? {
                platform: t.platform,
                asin: t.asin ?? undefined,
                itemId: t.itemId ?? undefined,
                placeId: t.placeId ?? undefined,
                url: t.url ?? undefined,
              }
            : undefined,
        }}
      />
    </main>
  );
}

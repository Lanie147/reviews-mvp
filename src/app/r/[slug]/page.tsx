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
  const slug = (await params).slug;
  const campaign = await db.campaign.findUnique({
    where: { slug },
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
          ...campaign,
          marketplace: {
            ...campaign.marketplace,
            tld: campaign.marketplace.tld ?? "com",
          },
        }}
        products={campaign.targets.map((target) => ({
          asin: target.asin!,
          image: `https://images-na.ssl-images-amazon.com/images/P/${target.asin}.jpg`,
          title: target.asin || "Product",
        }))}
      />
    </main>
  );
}

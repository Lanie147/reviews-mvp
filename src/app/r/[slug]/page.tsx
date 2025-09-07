import { db } from "@/lib/db";
import { buildReviewUrl } from "@/lib/reviewLink";

export default async function Page({ params }: { params: { slug: string } }) {
  const campaign = await db.campaign.findUnique({
    where: { slug: params.slug },
    include: { targets: true, marketplace: true },
  });
  if (!campaign) return <div className="p-6">Not found</div>;

  const tld = campaign.marketplace?.tld ?? "co.uk";
  const links = campaign.targets
    .map((t) => ({
      platform: t.platform,
      href: buildReviewUrl({
        platform: t.platform,
        asin: t.asin ?? undefined,
        url: t.url ?? undefined,
        tld,
      }),
    }))
    .filter((x) => !!x.href) as { platform: string; href: string }[];

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Share your experience</h1>
      <p className="mt-2 text-gray-600">
        Thanks for supporting a UK seller. Choose where to leave a review:
      </p>
      <div className="mt-6 space-y-3">
        {links.map((l) => (
          <a
            key={l.platform}
            href={l.href}
            className="block rounded-lg border px-4 py-3 hover:bg-gray-50"
          >
            {l.platform === "AMAZON" ? "Amazon product review" : l.platform}
          </a>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Need help?{" "}
        <a className="underline" href="mailto:support@yourbrand.co.uk">
          Contact support
        </a>
      </p>
    </main>
  );
}

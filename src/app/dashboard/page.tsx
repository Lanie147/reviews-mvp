// src/app/dashboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import QRCode from "react-qr-code";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/CopyButton";
import { archiveCampaign, unarchiveCampaign } from "./actions";

function k(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "k";
  return Math.round(n / 1000) + "k";
}

export default async function Dashboard() {
  // One query for campaigns, plus direct counts for clicks & scans
  const [campaigns, reviewClicks, totalScans] = await Promise.all([
    prisma.campaign.findMany({
      include: { marketplace: true }, // we only need marketplace here
      orderBy: { createdAt: "desc" },
    }),
    prisma.reviewOpenEvent.count(), // "Copy & open review page" clicks
    prisma.scanEvent.count(), // QR short-link scans (e.g., /c/global)
  ]);

  const totals = {
    campaigns: campaigns.length,
    scans: totalScans,
    reviewClicks,
  };

  // Status is lowercase in DB: 'active' | 'archived'
  const active = campaigns.filter((c) => c.status !== "archived");
  const archived = campaigns.filter((c) => c.status === "archived");

  // Absolute base URL for QR target
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const resolvedBase =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "" ||
    (host ? `${proto}://${host}` : "");

  // Point the universal QR at your short link for scan tracking
  const globalLandingUrl = resolvedBase
    ? `${resolvedBase}/c/global`
    : "/c/global";

  return (
    <main className="mx-auto max-w-6xl p-6 bg-background text-foreground">
      {/* CSS-only modal for the global QR */}
      <style>{`
        .qr-modal{opacity:0;pointer-events:none;transition:opacity .15s ease}
        .qr-modal:target{opacity:1;pointer-events:auto}
      `}</style>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage review campaigns and short links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* One universal QR for all campaigns */}
          <Button variant="outline" asChild>
            <a href="#global-qr">Show global QR</a>
          </Button>
          <Button asChild>
            <Link href="/dashboard/new">+ New campaign</Link>
          </Button>
        </div>
      </div>

      {/* Global QR modal */}
      <div
        id="global-qr"
        className="qr-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-qr-title"
      >
        <a href="#" className="absolute inset-0" aria-label="Close" />
        <div className="relative mx-4 w-full max-w-sm rounded-xl border bg-background p-5 shadow-lg">
          <div className="absolute right-3 top-3">
            <Button size="sm" variant="ghost" asChild>
              <a href="#" aria-label="Close">
                Close
              </a>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <h2 id="global-qr-title" className="mb-3 text-base font-semibold">
              Scan to open
            </h2>
            <div className="rounded-md bg-white p-3">
              <QRCode value={globalLandingUrl} size={256} />
            </div>
            <code className="mt-3 break-all text-xs text-muted-foreground">
              {globalLandingUrl}
            </code>
            <div className="mt-3 flex gap-2">
              <CopyButton
                text={globalLandingUrl}
                className="rounded-lg border border-border px-2.5 py-1"
              >
                Copy URL
              </CopyButton>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totals.campaigns}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Review clicks
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {k(totals.reviewClicks)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total scans
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {k(totals.scans)}
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {!campaigns.length && (
        <Card className="mt-12 border-dashed">
          <CardContent className="p-10 text-center">
            <div className="text-lg font-medium">No campaigns yet</div>
            <p className="mt-1 text-muted-foreground">
              Create your first campaign to track product reviews.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/new">Create campaign</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active campaigns */}
      {!!active.length && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Active campaigns</h2>
          <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
            {active.map((c) => {
              const productImg =
                c.imageUrl ||
                (c.asin
                  ? `https://images-na.ssl-images-amazon.com/images/P/${c.asin}.jpg`
                  : null);

              return (
                <Card key={c.id} className="transition hover:shadow-md">
                  <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{c.name}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                          {c.marketplace?.platform ?? "—"} {c.marketplace?.code}
                        </Badge>
                        <span className="text-gray-300">•</span>
                        <code className="rounded-md bg-muted px-1.5 py-0.5">
                          /r/{c.slug}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {productImg && (
                        <Image
                          src={productImg}
                          alt={`${c.productName} image`}
                          width={112}
                          height={112}
                          className="h-28 w-28 rounded-md object-cover"
                          priority
                        />
                      )}

                      <div className="flex flex-col items-end gap-2">
                        <Button variant="outline" asChild>
                          <Link href="/r">Open landing</Link>
                        </Button>

                        {/* Archive button */}
                        <form action={archiveCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button variant="destructive" type="submit">
                            Archive
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardHeader>

                  <Separator />
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Archived campaigns */}
      {!!archived.length && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Archived campaigns</h2>
          <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
            {archived.map((c) => {
              const productImg =
                c.imageUrl ||
                (c.asin
                  ? `https://images-na.ssl-images-amazon.com/images/P/${c.asin}.jpg`
                  : null);

              return (
                <Card key={c.id} className="opacity-95">
                  <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{c.name}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">ARCHIVED</Badge>
                        <span className="text-gray-300">•</span>
                        <code className="rounded-md bg-muted px-1.5 py-0.5">
                          /r/{c.slug}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {productImg && (
                        <Image
                          src={productImg}
                          alt={`${c.productName} image`}
                          width={112}
                          height={112}
                          className="h-28 w-28 rounded-md object-cover"
                          priority
                        />
                      )}

                      <div className="flex flex-col items-end gap-2">
                        {/* Restore button */}
                        <form action={unarchiveCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button variant="secondary" type="submit">
                            Restore
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

// src/app/dashboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CampaignCard from "@/components/dashboard/CampaignCard";

import QRCode from "react-qr-code";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { CopyButton } from "@/components/CopyButton";
import { archiveCampaign, unarchiveCampaign, deleteCampaign } from "./actions";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

function k(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "k";
  return Math.round(n / 1000) + "k";
}

export default async function Dashboard() {
  const [campaigns, reviewClicks, totalScans] = await Promise.all([
    prisma.campaign.findMany({
      include: { marketplace: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reviewOpenEvent.count(),
    prisma.scanEvent.count(),
  ]);

  const totals = {
    campaigns: campaigns.length,
    scans: totalScans,
    reviewClicks,
  };

  // DB uses uppercase enum: 'ACTIVE' | 'ARCHIVED'
  const active = campaigns.filter((c) => c.status !== "ARCHIVED");
  const archived = campaigns.filter((c) => c.status === "ARCHIVED");

  // Absolute base URL for QR target
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const resolvedBase =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (host ? `${proto}://${host}` : "");

  const globalLandingUrl = resolvedBase ? `${resolvedBase}/r` : "/r";

  return (
    <main className="mx-auto max-w-6xl p-6 bg-background text-foreground">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Dashboard</h1>

      {/* Global stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <DashboardTabs
        defaultTab="campaigns"
        renderCampaigns={
          <>
            {/* CSS-only modal for the global QR */}
            <style>{`
              .qr-modal{opacity:0;pointer-events:none;transition:opacity .15s ease}
              .qr-modal:target{opacity:1;pointer-events:auto}
            `}</style>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Campaigns
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage review campaigns and short links.
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                  <h2
                    id="global-qr-title"
                    className="mb-3 text-base font-semibold"
                  >
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

            {/* Empty state */}
            {!campaigns.length && (
              <Card className="mt-4 border-dashed">
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
                <h3 className="mt-4 text-lg font-semibold">Active campaigns</h3>
                <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {active.map((c) => (
                    <CampaignCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      productName={c.productName}
                      asin={c.asin ?? undefined}
                      imageUrl={c.imageUrl ?? undefined}
                      slug={c.slug!}
                      marketplaceLabel={`${c.marketplace?.platform ?? "—"} ${
                        c.marketplace?.code ?? ""
                      }`}
                      status={c.status as "ACTIVE" | "ARCHIVED"}
                      actions={
                        <form action={archiveCampaign}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button
                            className="cursor-pointer"
                            variant="destructive"
                            type="submit"
                          >
                            Archive
                          </Button>
                        </form>
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </>
        }
        renderArchived={
          <>
            {!!archived.length && (
              <>
                <h3 className="mt-4 text-lg font-semibold">
                  Archived campaigns
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {archived.map((c) => (
                    <CampaignCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      productName={c.productName}
                      asin={c.asin ?? undefined}
                      imageUrl={c.imageUrl ?? undefined}
                      slug={c.slug!}
                      marketplaceLabel={`${c.marketplace?.platform ?? "—"} ${
                        c.marketplace?.code ?? ""
                      }`}
                      status="ARCHIVED"
                      actions={
                        <>
                          <form action={unarchiveCampaign}>
                            <input type="hidden" name="id" value={c.id} />
                            <Button
                              className="cursor-pointer"
                              variant="secondary"
                              type="submit"
                            >
                              Restore
                            </Button>
                          </form>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="cursor-pointer"
                                variant="destructive"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this campaign permanently?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This cannot be undone. The campaign and all
                                  related data will be removed for good.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <form action={deleteCampaign}>
                                <input type="hidden" name="id" value={c.id} />
                                <label className="block text-sm mb-1">
                                  Type <b>DELETE</b> to confirm
                                </label>
                                <input
                                  name="confirm"
                                  required
                                  pattern="DELETE"
                                  title='Type "DELETE"'
                                  className="w-full border rounded px-2 py-1 mb-4"
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel type="button">
                                    Cancel
                                  </AlertDialogCancel>
                                  <Button type="submit" variant="destructive">
                                    Permanently delete
                                  </Button>
                                </AlertDialogFooter>
                              </form>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </>
        }
      />
    </main>
  );
}

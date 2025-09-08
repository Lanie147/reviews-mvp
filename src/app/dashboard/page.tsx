// src/app/dashboard/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/CopyButton";

function k(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "k";
  return Math.round(n / 1000) + "k";
}

export default async function Dashboard() {
  const campaigns = await db.campaign.findMany({
    include: {
      marketplace: true,
      shortLinks: { include: { _count: { select: { scans: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = {
    campaigns: campaigns.length,
    links: campaigns.reduce((acc, c) => acc + c.shortLinks.length, 0),
    scans: campaigns.reduce(
      (acc, c) => acc + c.shortLinks.reduce((a, s) => a + s._count.scans, 0),
      0
    ),
  };

  return (
    <main className="mx-auto max-w-6xl p-6 bg-background text-foreground">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage QR short links and review targets.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">+ New campaign</Link>
        </Button>
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
              Short links
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totals.links}
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
              Create your first campaign to generate a QR and short link.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/new">Create campaign</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      {!!campaigns.length && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {campaigns.map((c) => {
            const scans = c.shortLinks.reduce((a, s) => a + s._count.scans, 0);
            return (
              <Card key={c.id} className="transition hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>{c.name}</CardTitle>
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
                  <Button variant="outline" asChild>
                    <Link href={`/r/${c.slug}`}>Open landing</Link>
                  </Button>
                </CardHeader>

                <Separator />

                <CardContent className="space-y-4 pt-4">
                  {c.shortLinks.map((s) => {
                    const shortPath = `/c/${s.slug}`;
                    const qrUrl = `/api/qr/${s.slug}`;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 rounded-xl border border-border p-3"
                      >
                        <Image
                          src={qrUrl}
                          alt="QR"
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 rounded-lg border bg-white object-contain p-2"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm">
                              {shortPath}
                            </code>
                            <Badge variant="outline">{scans} scans</Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <Button variant="outline" asChild>
                              <Link href={shortPath}>Test redirect</Link>
                            </Button>
                            <CopyButton
                              text={shortPath}
                              className="rounded-lg border border-border px-2.5 py-1"
                            >
                              Copy short path
                            </CopyButton>
                            <CopyButton
                              text={
                                (process.env.NEXT_PUBLIC_BASE_URL?.replace(
                                  /\/$/,
                                  ""
                                ) || "") + shortPath
                              }
                              className="rounded-lg border border-border px-2.5 py-1"
                            >
                              Copy full URL
                            </CopyButton>
                            <Button variant="outline" asChild>
                              <Link href={qrUrl}>Open QR</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

// src/components/dashboard/CampaignCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";

export type CampaignCardProps = {
  id: string;
  name: string;
  productName?: string | null;
  asin?: string | null;
  imageUrl?: string | null;
  slug: string;
  marketplaceLabel?: string | null; // e.g. "AMAZON UK"
  status?: "ACTIVE" | "ARCHIVED";
  /** Right-side custom actions (e.g., Archive/Restore/Delete forms) */
  actions?: React.ReactNode;
  /** Hide the QR block to make the card more compact */
  showQR?: boolean;
  className?: string;
};

export default function CampaignCard({
  name,
  productName,
  asin,
  imageUrl,
  slug,
  marketplaceLabel,
  status = "ACTIVE",
  actions,
  showQR = true,
  className,
}: CampaignCardProps) {
  // Resolve absolute URL for QR (env first, then window origin)
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  const base =
    (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ""
    ).replace(/\/$/, "") || origin;
  const campaignUrl = base ? `${base}/r/${slug}` : `/r/${slug}`;

  // Prefer explicit imageUrl, fall back to Amazon CDN if asin is present, else placeholder
  const previewSrc =
    (imageUrl && imageUrl.trim()) ||
    (asin
      ? `https://images-eu.ssl-images-amazon.com/images/P/${asin}.jpg`
      : "/placeholder.svg");
  const alt = `${productName ?? name} image`;

  const isArchived = status === "ARCHIVED";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/60 shadow-sm transition hover:shadow-lg",
        isArchived && "opacity-95",
        className
      )}
    >
      {/* subtle hover sheen */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="truncate text-base sm:text-lg">
              {name}
            </CardTitle>
            {isArchived && (
              <Badge variant="outline" className="shrink-0">
                ARCHIVED
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {marketplaceLabel && (
              <Badge variant="secondary" className="shrink-0">
                {marketplaceLabel}
              </Badge>
            )}
            {asin && (
              <>
                <span className="text-gray-300">•</span>
                <span className="truncate">{asin}</span>
              </>
            )}
            <span className="text-gray-300">•</span>
            <code className="rounded-md bg-muted px-1.5 py-0.5">/r/{slug}</code>
          </div>
        </div>

        {/* Product image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
          <Image
            src={previewSrc}
            alt={alt}
            width={96}
            height={96}
            className="h-24 w-24 object-cover"
            priority
          />
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        {/* Left: QR + meta */}
        {showQR ? (
          <div className="flex items-center gap-3">
            <div className="rounded-md border bg-white p-2 dark:bg-white">
              {/* 96x96 QR in a padded box */}
              <QRCode value={campaignUrl} size={96} />
            </div>
            <div className="text-sm">
              <div className="font-medium">Scan to review</div>
              <div className="break-all text-muted-foreground">
                {campaignUrl}
              </div>
              <div className="mt-1">
                <CopyButton text={campaignUrl} className="h-7 px-2 text-xs">
                  Copy URL
                </CopyButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">/r/{slug}</div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button asChild variant="outline">
            <Link
              href={campaignUrl}
              aria-label={`Open ${name} landing`}
              prefetch={false}
            >
              Open landing
            </Link>
          </Button>
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}

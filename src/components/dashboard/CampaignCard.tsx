"use client";

import * as React from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // optional; remove if you don't have it

type CampaignCardProps = {
  id: string;
  name: string;
  productName: string;
  asin?: string | null;
  imageUrl?: string | null;
  slug: string;
  className?: string;
};

export default function CampaignCard({
  name,
  productName,
  asin,
  imageUrl,
  slug,
  className,
}: CampaignCardProps) {
  // Prefer absolute URL for QR; fall back to client origin if env not set
  const [origin, setOrigin] = React.useState<string>("");
  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const campaignUrl = base ? `${base}/r/${slug}` : `/r/${slug}`;

  const previewSrc = (imageUrl && imageUrl.trim()) || "/placeholder.svg";
  const alt = `${productName} image`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate">{name}</CardTitle>
          <p className="text-sm text-muted-foreground truncate">
            {productName} {asin ? `· ${asin}` : ""}
          </p>
        </div>
        {/* Product image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
          <Image
            src={previewSrc}
            alt={alt}
            width={80}
            height={80}
            className="h-20 w-20 object-cover"
            priority
          />
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-4">
        {/* QR code (SVG) */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-md border">
            {/* 96x96 QR in a 112x112 box (with padding) */}
            <QRCode value={campaignUrl} size={96} />
          </div>
          <div className="text-sm">
            <div className="font-medium">Scan to review</div>
            <div className="text-muted-foreground break-all">/r/{slug}</div>
          </div>
        </div>

        <a href={campaignUrl}>
          <Button variant="secondary">Open landing</Button>
        </a>
      </CardContent>
    </Card>
  );
}

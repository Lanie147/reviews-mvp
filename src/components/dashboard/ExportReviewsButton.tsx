// src/components/dashboard/ExportReviewsButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function buildHref(opts: {
  from?: string;
  to?: string;
  campaignId?: string;
  minRating?: number;
  maxRating?: number;
  used7Days?: boolean;
}) {
  const qs = new URLSearchParams();
  if (opts.from) qs.set("from", opts.from);
  if (opts.to) qs.set("to", opts.to);
  if (opts.campaignId) qs.set("campaignId", opts.campaignId);
  if (opts.minRating !== undefined) qs.set("minRating", String(opts.minRating));
  if (opts.maxRating !== undefined) qs.set("maxRating", String(opts.maxRating));
  if (opts.used7Days !== undefined)
    qs.set("used7Days", opts.used7Days ? "true" : "false");
  return `/api/reviews/export${qs.toString() ? `?${qs.toString()}` : ""}`;
}

export default function ExportReviewsButton(props: {
  from?: string;
  to?: string;
  campaignId?: string;
  minRating?: number;
  maxRating?: number;
  used7Days?: boolean;
  className?: string;
  filenameHint?: string; // optional custom filename base
}) {
  const href = buildHref(props);

  const handleClick = async () => {
    // Fetch as a file (no navigation; avoids RSC interception)
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) {
      // You could show a toast here with res.statusText
      console.error("CSV export failed", res.status, res.statusText);
      return;
    }

    const blob = await res.blob();

    // Try to extract filename from header; fallback to hint or default
    const cd = res.headers.get("Content-Disposition") || "";
    const match = /filename=\"?([^\";]+)\"?/i.exec(cd);
    const filename =
      match?.[1] ||
      `${props.filenameHint ?? "reviews"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleClick} variant="outline" className={props.className}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}

// Shared types + helpers for the Review flow
export type Platform = "AMAZON" | "EBAY" | "GOOGLE" | "SHOPIFY" | "CUSTOM";

export type MarketplaceDTO = {
  platform: Platform;
  code: string;
  tld?: string | null;
  externalId?: string | null;
};

export type ReviewTargetLite = {
  id: string;
  platform: Platform;
  asin?: string | null;
  itemId?: string | null;
  placeId?: string | null;
  url?: string | null;
  title: string;
  image?: string | null;
  isPrimary: boolean;
};

export type CampaignProps = {
  id: string;
  name: string;
  productName: string;
  asin?: string | null;
  imageUrl?: string | null;
  slug: string;
  status: string;
  marketplace?: MarketplaceDTO | null;
  reviewTargets: ReviewTargetLite[];
};

export type ProductOption = {
  asin?: string | null; // optional so we can support non-Amazon targets
  image: string;
  title: string;
};

// --- Helpers ---

/** Auto-format: 3-7-7 pattern for Amazon orders (e.g., 123-1234567-1234567) */
// Inserts dashes as the user types: 123-1234567-1234567
export function formatAmazonOrderLive(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 17); // keep only 17 digits max
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}
export type BuildReviewUrlParams = {
  target: ReviewTargetLite;
  marketplace?: MarketplaceDTO | null;
  asin?: string | null;
  productName: string;
};

/** Build an external review URL for the selected target (Amazon/Google/eBay) */
export function buildReviewUrl({
  target,
  marketplace,
  asin,
  productName,
}: BuildReviewUrlParams): string {
  // Use your real logic here; this is a safe default scaffold.
  // AMAZON example (UK): take asin + marketplace.tld if present.
  if (target.platform === "AMAZON") {
    const domain = marketplace?.tld
      ? `amazon.${marketplace.tld}`
      : "amazon.co.uk";
    const asinPart = target.asin || asin || "";
    // e.g. to write-a-review (product review page can vary by locale)
    return asinPart
      ? `https://${domain}/review/create-review?asin=${encodeURIComponent(
          asinPart
        )}`
      : `https://${domain}/review`;
  }

  if (target.platform === "GOOGLE") {
    // Prefer a direct place link if provided
    if (target.url) return target.url;
    // fallback: generic search
    return `https://www.google.com/search?q=${encodeURIComponent(
      `${productName} reviews`
    )}`;
  }

  if (target.url) return target.url;

  // Generic fallback
  return "#";
}

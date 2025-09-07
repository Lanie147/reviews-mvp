import type { Platform } from "@prisma/client";

type BuildArgs = {
  platform: Platform;
  asin?: string;
  itemId?: string;
  placeId?: string;
  url?: string;
  tld?: string; // e.g. "co.uk"
};

export function buildReviewUrl({
  platform,
  asin,
  itemId,
  placeId,
  url,
  tld = "co.uk",
}: BuildArgs) {
  switch (platform) {
    case "AMAZON":
      return asin
        ? `https://www.amazon.${tld}/review/create-review?asin=${asin}`
        : null;
    case "EBAY":
      return url ?? null; // add pattern later
    case "GOOGLE":
      return placeId
        ? `https://search.google.com/local/writereview?placeid=${placeId}`
        : url ?? null;
    case "SHOPIFY":
    case "CUSTOM":
      return url ?? null;
    default:
      return null;
  }
}

// src/lib/normalize.ts
import type {
  CampaignProps,
  MarketplaceDTO,
  Platform,
  ReviewTargetLite,
} from "./review-helpers";

// If you want, you can type these Prisma shapes more strictly via generated types.
// Keeping them as 'any' here is NOT allowed, so define minimal shapes you use:
type PrismaMarketplace = {
  platform: Platform | string;
  code: string;
  tld: string | null;
  externalId: string | null;
};

type PrismaReviewTarget = {
  id: string;
  platform: Platform | string;
  asin: string | null;
  itemId: string | null;
  placeId: string | null;
  url: string | null;
  isPrimary: boolean;
  title: string;
  image: string | null;
};

type PrismaCampaign = {
  id: string;
  name: string;
  productName: string;
  asin: string | null;
  imageUrl: string | null;
  slug: string;
  status: string;
  marketplace: PrismaMarketplace | null;
  reviewTargets: PrismaReviewTarget[];
};

export function normalizeCampaign(c: PrismaCampaign): CampaignProps {
  const marketplace: MarketplaceDTO | null = c.marketplace
    ? {
        platform: c.marketplace.platform as Platform,
        code: c.marketplace.code,
        tld: c.marketplace.tld,
        externalId: c.marketplace.externalId,
      }
    : null;

  const reviewTargets: ReviewTargetLite[] = (c.reviewTargets ?? []).map(
    (t) => ({
      id: t.id,
      platform: t.platform as Platform,
      asin: t.asin,
      itemId: t.itemId,
      placeId: t.placeId,
      url: t.url,
      isPrimary: t.isPrimary,
      title: t.title,
      image: t.image,
    })
  );

  return {
    id: c.id,
    name: c.name,
    productName: c.productName,
    asin: c.asin,
    imageUrl: c.imageUrl,
    slug: c.slug,
    status: c.status,
    marketplace,
    reviewTargets,
  };
}

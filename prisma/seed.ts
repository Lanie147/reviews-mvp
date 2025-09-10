// prisma/seed.ts
import { PrismaClient, Platform } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // 1) Marketplace (idempotent via upsert with fixed id)
  const marketplace = await db.marketplace.upsert({
    where: { id: "mkt-amazon-uk" },
    update: {},
    create: {
      id: "mkt-amazon-uk",
      platform: Platform.AMAZON, // ✅ enum, not string
      code: "UK",
      tld: "co.uk",
      externalId: "SELLER_ID_OPTIONAL",
    },
  });

  // 2) Campaign linked to marketplace
  const campaign = await db.campaign.upsert({
    where: { slug: "amz-uk-sept" }, // assumes slug is unique
    update: {},
    create: {
      id: "camp-amz-uk-sept",
      name: "Amazon UK – Sept",
      slug: "amz-uk-sept",
      marketplace: { connect: { id: marketplace.id } },
    },
  });

  // 3) Review target for this campaign (idempotent)
  await db.reviewTarget.upsert({
    where: { id: "target-B0XXXXXXX" },
    update: {
      // keep these in sync if you change them later
      title: "Amazon Product B0XXXXXXX",
      image: "https://images-na.ssl-images-amazon.com/images/P/B0XXXXXXX.jpg",
      platform: Platform.AMAZON, // ✅ enum
      asin: "B0XXXXXXX",
      isPrimary: true,
      campaign: { connect: { id: campaign.id } },
    },
    create: {
      id: "target-B0XXXXXXX",
      title: "Amazon Product B0XXXXXXX",
      image: "https://images-na.ssl-images-amazon.com/images/P/B0XXXXXXX.jpg",
      platform: Platform.AMAZON, // ✅ enum
      asin: "B0XXXXXXX",
      isPrimary: true,
      campaign: { connect: { id: campaign.id } },
    },
  });

  // 4) Short link for the campaign (idempotent)
  await db.shortLink.upsert({
    where: { slug: "amz-sept-1" }, // assumes slug is unique
    update: { campaignId: campaign.id },
    create: {
      id: "short-amz-sept-1",
      slug: "amz-sept-1",
      campaign: { connect: { id: campaign.id } },
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

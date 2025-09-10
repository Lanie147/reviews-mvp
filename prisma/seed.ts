import { PrismaClient, Platform } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Marketplace (Amazon UK)
  const mkt = await db.marketplace.create({
    data: {
      platform: Platform.AMAZON,
      code: "UK",
      tld: "co.uk",
      externalId: "SELLER_ID_OPTIONAL",
    },
  });

  // Campaign linked to marketplace (use relation connect)
  const campaign = await db.campaign.create({
    data: {
      name: "Amazon UK – Sept",
      slug: "amz-uk-sept",
      marketplace: { connect: { id: mkt.id } },
    },
  });

  // Review target for this campaign
  await db.reviewTarget.create({
    data: {
      campaign: {
        connect: {
          id: campaign.id, // Use the campaign.id instead of hardcoded ID
        },
      },
      platform: "AMAZON",
      asin: "B0XXXXXXX",
      isPrimary: true,
      title: "Amazon Product B0XXXXXXX",
      image: `https://images-na.ssl-images-amazon.com/images/P/B0XXXXXXX.jpg`,
    },
  });

  // Short link for the campaign
  await db.shortLink.create({
    data: {
      campaign: { connect: { id: campaign.id } },
      slug: "amz-sept-1",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

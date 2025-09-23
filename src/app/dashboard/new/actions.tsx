"use server";
// at top of file
import { Platform } from "@prisma/client";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validation/campaign";

// tiny slug helpers
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
async function uniqueSlug(base: string) {
  let slug = base,
    i = 1;
  while (await prisma.campaign.findUnique({ where: { slug } }))
    slug = `${base}-${i++}`;
  return slug;
}

const DEFAULT_MARKETPLACE_ID = "mkt-amazon-uk";

async function getDefaultMarketplaceId() {
  // Upsert by a stable id so it always exists
  const mp = await prisma.marketplace.upsert({
    where: { id: DEFAULT_MARKETPLACE_ID },
    update: {}, // nothing to change on subsequent runs
    create: {
      id: DEFAULT_MARKETPLACE_ID,
      platform: Platform.AMAZON, // <-- enum, not string
      code: "UK",
      tld: "co.uk",
      // externalId: "SELLER_ID_OPTIONAL", // if your schema has it
    },
    select: { id: true },
  });
  return mp.id;
}

export async function createCampaign(formData: FormData) {
  const raw = {
    name: String(formData.get("name") || ""),
    productName: String(formData.get("productName") || ""),
    asin: String(formData.get("asin") || ""),
    imageUrl: String(formData.get("imageUrl") || ""),
  };

  const parsed = campaignCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, productName, asin, imageUrl } = parsed.data;

  const slug = await uniqueSlug(slugify(`${productName}-${asin}`));
  const marketplaceId = await getDefaultMarketplaceId();

  await prisma.campaign.create({
    data: {
      name,
      productName,
      asin: asin.toUpperCase(),
      imageUrl,
      slug,
      status: "active", // if your schema has this with default, you can omit
      marketplace: { connect: { id: marketplaceId } }, // <-- required relation satisfied
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

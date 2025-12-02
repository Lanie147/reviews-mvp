"use server";
// at top of file
import { platform } from "@prisma/client";
import { randomUUID } from "crypto";

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
      platform: platform.AMAZON, // <-- enum, not string
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
  const id = randomUUID(); // ensure id provided because Prisma schema requires it

  await prisma.campaign.create({
    data: {
      id,
      name,
      productName,
      asin,
      imageUrl,
      slug,
      status: "active",
      marketplace: { connect: { id: marketplaceId } },
    },
  });

  // Attach selected products (form sends multiple productIds)
  const productIds = formData.getAll("productIds").map(String).map((s) => s.trim()).filter(Boolean);
  if (productIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { campaignId: id },
    });
  }

  revalidatePath("/dashboard");
  return { ok: true, campaignId: id };
}

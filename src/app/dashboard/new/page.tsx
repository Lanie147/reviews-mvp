// src/app/dashboard/new/page.tsx
export const runtime = "nodejs";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import Link from "next/link";

// ---- helpers ----
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

const FormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  campaignSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only")
    .min(3)
    .max(48),
  asin: z.string().regex(/^[A-Z0-9]{10}$/, "ASIN must be 10 chars (A–Z, 0–9)"),
  shortSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only")
    .min(3)
    .max(48),
});

// ensure we have an Amazon UK marketplace
async function ensureAmazonUkMarketplace() {
  const existing = await db.marketplace.findFirst({
    where: { platform: "AMAZON", code: "UK", tld: "co.uk" },
  });
  if (existing) return existing;
  return db.marketplace.create({
    data: { platform: "AMAZON", code: "UK", tld: "co.uk" },
  });
}

export default async function NewCampaignPage() {
  // Server Action
  async function createCampaignAction(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const campaignSlug = slugify(String(formData.get("campaignSlug") || ""));
    const shortSlug = slugify(String(formData.get("shortSlug") || ""));
    const asinInput = String(formData.get("asin") || "");
    const asinMatch = asinInput.toUpperCase().match(/[A-Z0-9]{10}/);
    const asin = asinMatch ? asinMatch[0] : "";

    const parsed = FormSchema.safeParse({
      name,
      campaignSlug,
      asin,
      shortSlug,
    });
    if (!parsed.success) {
      const err = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(err).flatMap(([k, v]) =>
        v && v.length ? [`${k}: ${v.join(", ")}`] : []
      );
      throw new Error(messages.join(" | ") || "Invalid input");
    }

    // unique short slug
    const exists = await db.shortLink.findUnique({
      where: { slug: shortSlug },
    });
    if (exists)
      throw new Error(`Short link slug "${shortSlug}" is already taken`);

    const mkt = await ensureAmazonUkMarketplace();

    const campaign = await db.campaign.create({
      data: {
        name,
        slug: campaignSlug,
        marketplace: { connect: { id: mkt.id } },
      },
    });

    await db.reviewTarget.create({
      data: {
        campaign: { connect: { id: campaign.id } },
        platform: "AMAZON",
        asin,
        isPrimary: true,
        title: name, // Using the campaign name as the review target title
      },
    });

    await db.shortLink.create({
      data: { campaign: { connect: { id: campaign.id } }, slug: shortSlug },
    });

    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Campaign</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 underline">
          Back to dashboard
        </Link>
      </div>

      <form action={createCampaignAction} className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            required
            placeholder="Amazon UK – Autumn"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Campaign slug</label>
          <input
            name="campaignSlug"
            required
            placeholder="amz-uk-autumn"
            pattern="^[a-z0-9-]+$"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lowercase, numbers, dashes.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Amazon ASIN</label>
          <input
            name="asin"
            required
            placeholder="B0ABCDEFGH"
            className="mt-1 w-full rounded-lg border px-3 py-2 uppercase"
          />
          <p className="mt-1 text-xs text-gray-500">
            10 characters, letters/numbers.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Short link slug</label>
          <input
            name="shortSlug"
            required
            placeholder="amz-autumn-1"
            pattern="^[a-z0-9-]+$"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            This becomes <code>/c/&lt;slug&gt;</code> and the QR target.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Create
        </button>
      </form>
    </main>
  );
}

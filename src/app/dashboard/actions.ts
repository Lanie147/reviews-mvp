"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

function getId(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) throw new Error("Missing campaign id");
  return id;
}

async function revalidateAll(slug?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/r"); // generic landing page product list
  if (slug) revalidatePath(`/r/${slug}`); // legacy slug page (harmless if unused)
}

export async function archiveCampaign(fd: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = getId(fd);

  // grab slug once so we can revalidate its page if needed
  const current = await prisma.campaign.findUnique({
    where: { id },
    select: { slug: true },
  });

  await prisma.campaign.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await revalidateAll(current?.slug ?? null);
}

export async function unarchiveCampaign(fd: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = getId(fd);

  const current = await prisma.campaign.findUnique({
    where: { id },
    select: { asin: true, slug: true },
  });
  if (!current) throw new Error("Campaign not found");

  // Guard: prevent two ACTIVE campaigns with the same ASIN
  if (current.asin) {
    const clash = await prisma.campaign.findFirst({
      where: {
        asin: current.asin,
        status: { not: "ARCHIVED" },
        NOT: { id },
      },
      select: { id: true },
    });
    if (clash) {
      // Throwing will surface in the action error; if you prefer returning a value,
      // you can return { ok: false, error: "..." } and handle it client-side.
      throw new Error(
        "Cannot restore: another active campaign uses this ASIN."
      );
    }
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  await revalidateAll(current.slug);
}

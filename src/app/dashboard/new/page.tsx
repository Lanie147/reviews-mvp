"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  campaignCreateSchema,
  type CampaignCreate,
} from "@/lib/validation/campaign";
import { createCampaign } from "./actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NewCampaignPage() {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CampaignCreate>({
    resolver: zodResolver(campaignCreateSchema),
    mode: "onChange",
    defaultValues: { name: "", productName: "", asin: "", imageUrl: "" },
  });

  const productName = watch("productName");
  const imageUrl = watch("imageUrl");

  // Prepare preview values safely
  const previewSrc = preview && preview.trim() !== "" ? preview.trim() : null;
  const alt =
    (productName && `${productName} image preview`) || "Campaign image preview";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => {
              const fd = new FormData();
              fd.set("name", values.name);
              fd.set("productName", values.productName);
              fd.set("asin", values.asin);
              fd.set("imageUrl", values.imageUrl);

              startTransition(async () => {
                const res = await createCampaign(fd);
                if (res.ok) window.location.href = "/dashboard";
              });
            })}
            className="space-y-5"
          >
            <div className="grid gap-2">
              <Label htmlFor="productName">Product name</Label>
              <Input id="productName" {...register("productName")} />
              {errors.productName && (
                <p className="text-xs text-destructive">
                  {errors.productName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="asin">ASIN</Label>
              <Input
                id="asin"
                maxLength={10}
                className="uppercase"
                {...register("asin")}
              />
              {errors.asin && (
                <p className="text-xs text-destructive">
                  {errors.asin.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                placeholder="e.g. Q4 Push"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Link to image</Label>
              <Input
                id="imageUrl"
                placeholder="https://…"
                {...register("imageUrl")}
                onBlur={() => setPreview(imageUrl?.trim() || null)}
              />
              {errors.imageUrl && (
                <p className="text-xs text-destructive">
                  {errors.imageUrl.message}
                </p>
              )}

              {previewSrc && (
                <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-md">
                  <Image
                    src={previewSrc}
                    alt={alt}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-md object-cover"
                    priority
                    // Remove `unoptimized` after adding remotePatterns in next.config.js for your image host(s)
                    // unoptimized
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={!isValid || pending}
                className="w-full"
              >
                {pending ? "Creating…" : "Create campaign"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

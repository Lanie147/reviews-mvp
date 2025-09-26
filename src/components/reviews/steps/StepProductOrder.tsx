// src/components/review/StepProductOrder.tsx
"use client";
import React from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProductOption = {
  id: string; // campaign id in your effective list
  name: string;
  asin?: string | null;
  imageUrl?: string | null;
};

export default function StepProductOrder({
  product,
  productOptions,
  orderNumber,
  onSelectProduct,
  onOrderNumberChange,
  onNext,
}: {
  product: ProductOption | null;
  productOptions: ProductOption[];
  orderNumber: string;
  onSelectProduct: (id: string) => void;
  onOrderNumberChange: (value: string) => void;
  onNext: () => void;
}) {
  const canContinue =
    !!product && /^\d{3}-\d{7}-\d{7}$/.test(orderNumber.trim());

  // Prefer explicit imageUrl, else fall back to Amazon CDN by ASIN
  const previewSrc = product
    ? product.imageUrl?.trim() ||
      (product.asin
        ? `https://images-eu.ssl-images-amazon.com/images/P/${product.asin}.jpg`
        : "")
    : "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canContinue) onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* When a product is selected, switch to a 2-col layout with a larger preview */}
      <div
        className={
          product
            ? "grid grid-cols-[auto,1fr] items-start gap-4 sm:gap-6"
            : "grid grid-cols-1 gap-4 sm:gap-6"
        }
      >
        {/* Large product preview — only after selection */}
        {product && (
          <div className="row-span-2">
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-xl border bg-muted">
              {previewSrc ? (
                <Image
                  src={previewSrc}
                  alt={`${product.name} image`}
                  fill
                  sizes="144px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
          </div>
        )}

        {/* Product select */}
        <div className={product ? "" : "sm:max-w-md"}>
          <Label htmlFor="product" className="text-sm">
            Product
          </Label>
          <div className="mt-1">
            <Select value={product?.id ?? ""} onValueChange={onSelectProduct}>
              <SelectTrigger id="product" className="h-12 text-base w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="py-3 text-base"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order number */}
        <div className={product ? "" : "sm:max-w-md"}>
          <Label htmlFor="orderNumber" className="text-sm">
            Amazon order number
          </Label>
          <Input
            id="orderNumber"
            inputMode="numeric"
            placeholder="123-1234567-1234567"
            className="h-12 text-base mt-1"
            value={orderNumber}
            onChange={(e) => onOrderNumberChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Find it in your Amazon order email/receipts.
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="pt-1">
        <Button
          type="submit"
          className="h-12 w-full sm:w-auto sm:min-w-[200px]"
          disabled={!canContinue}
          aria-disabled={!canContinue}
        >
          Continue
        </Button>
        {!canContinue && (
          <p className="mt-2 text-xs text-muted-foreground">
            Select a product and enter your order number to continue.
          </p>
        )}
      </div>
    </form>
  );
}

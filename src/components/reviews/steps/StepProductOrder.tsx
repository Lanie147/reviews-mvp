"use client";
import React from "react";
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
import Image from "next/image";

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

  return (
    <div className="space-y-4">
      {/* Product picker */}
      <div className="space-y-2">
        <Label htmlFor="product" className="text-sm">
          Product
        </Label>
        <div className="flex items-center gap-3">
          {product?.imageUrl ? (
            <div className="shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={64}
                height={64}
                className="rounded-lg object-cover aspect-square"
              />
            </div>
          ) : null}
          <Select
            defaultValue={product?.id}
            onValueChange={(v) => onSelectProduct(v)}
          >
            <SelectTrigger id="product" className="h-12 text-base">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {productOptions.map((p) => (
                <SelectItem key={p.id} value={p.id} className="py-3 text-base">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order number */}
      <div className="space-y-2">
        <Label htmlFor="orderNumber" className="text-sm">
          Amazon order number
        </Label>
        <Input
          id="orderNumber"
          inputMode="numeric"
          placeholder="123-1234567-1234567"
          className="h-12 text-base"
          value={orderNumber}
          onChange={(e) => onOrderNumberChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Find it in your Amazon order email/receipts.
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          className="h-12 w-full"
          disabled={!canContinue}
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

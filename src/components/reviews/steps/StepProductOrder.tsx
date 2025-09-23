"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProductOption = {
  id: string;
  name: string;
  asin?: string | null;
  imageUrl?: string | null;
};

type Props = {
  product: ProductOption | null;
  productOptions: ProductOption[];
  orderNumber: string;
  onSelectProduct: (id: string) => void;
  onOrderNumberChange: (value: string) => void;
  onNext: () => void;
};

export default function StepProductOrder({
  product,
  productOptions,
  orderNumber,
  onSelectProduct,
  onOrderNumberChange,
  onNext,
}: Props) {
  React.useEffect(() => {
    if (!product && productOptions.length > 0) {
      onSelectProduct(productOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, productOptions]);
  const canNext = Boolean(product) && orderNumber.trim().length > 0;
  const selectedId = product?.id ?? productOptions[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product">Product</Label>
        <Select
          key={productOptions.map((p) => p.id).join("|")}
          value={selectedId}
          defaultValue={selectedId}
          onValueChange={(v) => onSelectProduct(v)}
        >
          <SelectTrigger id="product" className="w-full">
            <SelectValue placeholder="Select ASIN" />
          </SelectTrigger>
          <SelectContent>
            {productOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {/* Show ONLY the ASIN (fallback to id if needed) */}
                {p.asin ?? p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Amazon order number</Label>
        <Input
          id="order"
          inputMode="numeric"
          placeholder="123-1234567-1234567"
          value={orderNumber}
          onChange={(e) => onOrderNumberChange(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          We use this only to verify purchases for rewards. It’s never shared.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={onNext} disabled={!canNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

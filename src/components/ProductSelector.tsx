// Language: tsx
// File: src/components/ProductSelector.tsx
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  externalId?: string | null;
  title?: string | null;
  marketplaceId?: string | null;
  campaignId?: string | null;
};

export default function ProductSelector({
  name = "productIds",
  filterUnassigned = true,
}: {
  name?: string;
  filterUnassigned?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/products");
      const json = await res.json();
      const list: Product[] = json.products ?? [];
      setProducts(list);
    }
    load();
  }, []);

  const visible = products
    .filter((p) => (filterUnassigned ? !p.campaignId : true))
    .filter((p) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (p.title ?? p.externalId ?? "").toLowerCase().includes(q);
    });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 bg-white/5"
        />
        <div className="text-sm text-muted-foreground">{visible.length} shown</div>
      </div>

      <div className="grid gap-2 max-h-64 overflow-auto border rounded-md p-2 bg-white/3">
        {visible.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <input type="checkbox" name={name} value={p.id} className="w-4 h-4" />
            <div className="text-sm">
              <div className="font-medium">{p.title ?? p.externalId ?? "Untitled"}</div>
              <div className="text-xs text-muted-foreground">{p.externalId ?? "—"}</div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">{p.campaignId ? "Assigned" : "Unassigned"}</div>
          </label>
        ))}
        {visible.length === 0 && <div className="text-sm text-muted-foreground p-2">No products</div>}
      </div>
    </div>
  );
}
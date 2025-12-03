// Language: tsx
// File: src/app/dashboard/ProductsTab.tsx
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  externalId?: string | null;
  title?: string | null;
  marketplaceId?: string | null;
  campaignId?: string | null;
  createdAt?: string;
};

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [externalIds, setExternalIds] = useState("");
  const [title, setTitle] = useState("");
  const [marketplaceId, setMarketplaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/products");
      const j = await res.json();
      setProducts(j.products ?? []);
    } catch {
      setProducts([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!externalIds.trim()) return setError("Enter at least one external id");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalIds,
          title: title || undefined,
          marketplaceId: marketplaceId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add products");
      setExternalIds("");
      setTitle("");
      setMarketplaceId("");
      await load();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Products</h2>

      <form onSubmit={handleAdd} className="space-y-2">
        <label className="text-sm">Add external IDs (one per line or comma separated)</label>
        <textarea
          value={externalIds}
          onChange={(e) => setExternalIds(e.target.value)}
          rows={3}
          className="w-full rounded-md border px-3 py-2 bg-white/5"
          placeholder="B000123, shopify-handle, ebay-id or one-per-line"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="col-span-2 rounded-md border px-3 py-2 bg-white/5"
          />
          <input
            value={marketplaceId}
            onChange={(e) => setMarketplaceId(e.target.value)}
            placeholder="marketplaceId (optional)"
            className="rounded-md border px-3 py-2 bg-white/5"
          />
        </div>

        <div className="flex gap-2">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add products"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setExternalIds("");
              setTitle("");
              setMarketplaceId("");
              setError(null);
            }}
          >
            Clear
          </button>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}
      </form>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">External ID</th>
              <th className="p-2 text-left">Marketplace</th>
              <th className="p-2 text-left">Campaign</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.title ?? p.externalId ?? "Untitled"}</td>
                <td className="p-2 text-muted-foreground">{p.externalId ?? "—"}</td>
                <td className="p-2 text-muted-foreground">{p.marketplaceId ?? "—"}</td>
                <td className="p-2 text-muted-foreground">{p.campaignId ?? "Unassigned"}</td>
                <td className="p-2 text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-sm text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
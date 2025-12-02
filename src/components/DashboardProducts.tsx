"use client";

import { useEffect, useState } from "react";

type InitialProduct = {
  id: string;
  externalId?: string | null;
  title?: string | null;
  marketplaceId?: string | null;
  campaignId?: string | null;
};

export default function DashboardProducts({
  campaignId,
  initialProducts = [],
}: {
  campaignId?: string;
  initialProducts?: InitialProduct[];
}) {
  const [products, setProducts] = useState<InitialProduct[]>(initialProducts);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [externalIds, setExternalIds] = useState("");
  const [title, setTitle] = useState("");
  const [marketplaceId, setMarketplaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // keep selection in sync if initialProducts change
    const map: Record<string, boolean> = {};
    products.forEach((p) => {
      if (selected[p.id]) map[p.id] = true;
    });
    setSelected((s) => ({ ...map, ...s }));
  }, [products]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] };
      setSelectAll(products.length > 0 && products.every((p) => next[p.id]));
      return next;
    });
  }

  function toggleAll() {
    const next = !selectAll;
    const map: Record<string, boolean> = {};
    products.forEach((p) => (map[p.id] = next));
    setSelected(map);
    setSelectAll(next);
  }

  async function assignSelectedToCampaign(targetCampaignId?: string | null) {
    const productIds = Object.keys(selected).filter((id) => selected[id]);
    if (productIds.length === 0) {
      setError("Select at least one product.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, campaignId: targetCampaignId ?? null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Assign failed");
      // optimistic update
      setProducts((prev) =>
        prev.map((p) => (productIds.includes(p.id) ? { ...p, campaignId: targetCampaignId ?? null } : p))
      );
      // clear selection
      setSelected({});
      setSelectAll(false);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

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
          marketplaceId: marketplaceId || null,
          campaignId: campaignId ?? null,
          title: title || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add products");
      const newIds = externalIds.split(/[\n,;,]+/).map((s) => s.trim()).filter(Boolean);
      const added = newIds.map((ext) => ({
        id: `tmp-${ext}-${Date.now()}`,
        externalId: ext,
        title: title || undefined,
        marketplaceId: marketplaceId || undefined,
        campaignId: campaignId ?? null,
      })) as InitialProduct[];
      setProducts((p) => [...added, ...p]);
      setExternalIds("");
      setTitle("");
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Products</h3>
        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={() => assignSelectedToCampaign(campaignId ?? null)}
            disabled={loading}
            title="Assign selected to this campaign"
          >
            {loading ? "Assigning…" : campaignId ? "Add selected to campaign" : "Assign selected"}
          </button>
          <button
            className="btn"
            onClick={() => assignSelectedToCampaign(null)}
            disabled={loading}
            title="Unassign selected from any campaign"
          >
            Unassign selected
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="space-y-2">
        <label className="block text-sm">Add external IDs (one per line or comma separated)</label>
        <textarea
          value={externalIds}
          onChange={(e) => setExternalIds(e.target.value)}
          rows={3}
          className="w-full rounded-md border px-3 py-2 bg-white/5"
          placeholder="B000123, SHOPIFY-HANDLE, 12345"
        />
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 bg-white/5"
            placeholder="Optional title for these products"
          />
          <input
            value={marketplaceId}
            onChange={(e) => setMarketplaceId(e.target.value)}
            className="w-48 rounded-md border px-3 py-2 bg-white/5"
            placeholder="marketplaceId (optional)"
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
      </form>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2">
                <input type="checkbox" checked={selectAll} onChange={toggleAll} />
              </th>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">External ID</th>
              <th className="text-left p-2">Marketplace</th>
              <th className="text-left p-2">Campaign</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">
                  <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} />
                </td>
                <td className="p-2">{p.title ?? p.externalId ?? "Untitled"}</td>
                <td className="p-2 text-muted-foreground">{p.externalId ?? "—"}</td>
                <td className="p-2 text-muted-foreground">{p.marketplaceId ?? "—"}</td>
                <td className="p-2 text-muted-foreground">{p.campaignId ?? "Unassigned"}</td>
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
    </section>
  );
}
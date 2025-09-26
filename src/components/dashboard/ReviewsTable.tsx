"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ExportReviewsButton from "./ExportReviewsButton";

// ---------------- Types ----------------
export type ReviewRow = {
  id: string;
  createdAt: string; // ISO
  campaignId: string | null;
  campaignName: string | null;
  productName: string | null;
  rating: number | null;
  reviewText: string;
  email: string | null;
  used7Days: boolean | null;
  orderNumber: string | null;
};

export type ReviewsResponse = {
  rows: ReviewRow[];
  total: number;
  products: { value: string; label: string }[]; // distinct product names
};
// ---------------- Component ----------------
export default function ReviewsTable() {
  // Filters
  const [q, setQ] = useState("");
  const [product, setProduct] = useState<string | "ALL">("ALL");
  const [ratings, setRatings] = useState<number[]>([]); // multi-select via checkboxes

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (q.trim()) params.set("q", q.trim());
    if (product && product !== "ALL") params.set("product", product);
    if (ratings.length) params.set("ratings", ratings.join(","));
    return params.toString();
  }, [q, product, ratings, page]);

  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/reviews/list?${query}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then((j: ReviewsResponse) => {
        if (active) setData(j);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const toggleRating = (r: number) => {
    setPage(1);
    setRatings((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <Label htmlFor="search" className="text-sm">
            Search (text/email/order)
          </Label>
          <Input
            id="search"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search reviews…"
          />
        </div>

        <div>
          <Label className="text-sm">Product</Label>
          <Select
            value={product}
            onValueChange={(v) => {
              setPage(1);
              setProduct(v as "ALL" | string);
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All products</SelectItem>
              {(data?.products ?? []).map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Ratings</Label>
          <div className="flex flex-wrap gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={ratings.includes(r)}
                  onCheckedChange={() => toggleRating(r)}
                  className="h-4 w-4"
                />
                <span>{r}★</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Review</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Order</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-destructive"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && (data?.rows ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No reviews found.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              (data?.rows ?? []).map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 min-w-[180px]">
                    <div className="truncate" title={row.productName ?? "—"}>
                      {row.productName ?? "—"}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate"
                      title={row.campaignName ?? ""}
                    >
                      {row.campaignName ?? ""}
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.rating ?? "—"}★</td>
                  <td className="px-3 py-2 max-w-[420px]">
                    <div className="line-clamp-3 whitespace-pre-wrap">
                      {row.reviewText}
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.email ?? "—"}</td>
                  <td className="px-3 py-2">{row.orderNumber ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">{total} total</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span>
            Page {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <ExportReviewsButton />
      </div>
    </div>
  );
}

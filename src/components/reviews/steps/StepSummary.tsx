"use client";
import React from "react";

export default function StepSummary({
  campaignName,
  rating,
  reviewText,
  email,
}: {
  campaignName: string;
  rating: number | null;
  reviewText: string;
  email: string;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs text-muted-foreground">Campaign</div>
        <div className="font-medium">{campaignName}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Rating</div>
        <div className="font-medium">{rating ?? "—"} ★</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Review</div>
        <div className="font-medium whitespace-pre-wrap">{reviewText}</div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Email</div>
        <div className="font-medium">{email || "—"}</div>
      </div>
      <p className="text-xs text-muted-foreground pt-2">
        Thanks for supporting a UK company.
      </p>
    </div>
  );
}

"use client";

import React from "react";

type Rating = 1 | 2 | 3 | 4 | 5;

type Props = {
  campaignName: string;
  rating: Rating | null;
  reviewText: string;
  email: string;
};

export default function StepSummary({
  campaignName,
  rating,
  reviewText,
  email,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Thanks for your review!</h3>
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Campaign:</span> {campaignName}
        </div>
        <div>
          <span className="font-medium">Rating:</span>{" "}
          {rating ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : "—"}
        </div>
        <div className="whitespace-pre-wrap">
          <span className="font-medium">Review:</span> {reviewText || "—"}
        </div>
        <div>
          <span className="font-medium">Email:</span> {email || "—"}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        We appreciate your time. If you need anything, just reply to our
        confirmation email.
      </p>
    </div>
  );
}

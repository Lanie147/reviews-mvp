"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Rating } from "./StepUsageRating";

export default function StepYourReview({
  rating,
  reviewText,
  onReviewTextChange,
  reviewUrl,
  hasOpenedExternal,
  countdownMs,
  onCopyAndOpen,
  canProceed,
  onBack,
  onNext,
  canCopyOpen, // 👈 NEW
}: {
  rating: Rating | null;
  reviewText: string;
  onReviewTextChange: (v: string) => void;
  reviewUrl: string | null;
  hasOpenedExternal: boolean;
  countdownMs: number;
  onCopyAndOpen: () => void;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  canCopyOpen: boolean; // 👈 NEW
}) {
  const minLen = 40; // display hint only; gating is controlled by parent via canCopyOpen
  const len = reviewText.trim().length;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reviewText" className="text-sm">
          Write your review
        </Label>
        <textarea
          id="reviewText"
          rows={6}
          value={reviewText}
          onChange={(e) => onReviewTextChange(e.target.value)}
          placeholder="What did you like? What could be better?"
          className="w-full rounded-md border bg-background px-3 py-3 text-base leading-relaxed shadow-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[140px]"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {len}/{minLen}+ chars
          </span>
          {rating &&
            (rating >= 4 ? (
              <span>Copy then post on Amazon</span>
            ) : (
              <span>We’ll handle the rest here</span>
            ))}
        </div>
      </div>

      {rating && rating >= 4 && (
        <div className="space-y-2">
          <Button
            type="button"
            onClick={onCopyAndOpen}
            className="h-12 w-full"
            // 👇 must have a URL AND meet the min chars
            disabled={!reviewUrl || !canCopyOpen}
            aria-disabled={!reviewUrl || !canCopyOpen}
          >
            {hasOpenedExternal
              ? "Open Amazon again"
              : "Copy review & open Amazon"}
          </Button>
          {!canCopyOpen && (
            <p className="text-xs text-muted-foreground text-center">
              Write at least {minLen} characters to enable this.
            </p>
          )}
          {hasOpenedExternal && (
            <p className="text-xs text-muted-foreground text-center">
              {countdownMs > 0
                ? `Please return here to finish in ${Math.ceil(
                    countdownMs / 1000
                  )}s…`
                : "Thanks! You can continue now."}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          className="h-12 flex-[2]"
          disabled={!canProceed}
          aria-disabled={!canProceed}
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// src/components/reviews/steps/StepYourReview.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Rating = 1 | 2 | 3 | 4 | 5;

type Props = {
  reviewText: string;
  onReviewTextChange: (value: string) => void;

  // gating + link
  rating: Rating | null;
  reviewUrl: string | null;
  hasOpenedExternal: boolean;
  countdownMs: number;
  onCopyAndOpen: () => void;
  canProceed: boolean; // computed in parent with MIN_REVIEW_LEN + gating

  onBack: () => void;
  onNext: () => void;
};

const MIN_REVIEW_LEN = 40;

export default function StepYourReview({
  reviewText,
  onReviewTextChange,
  rating,
  reviewUrl,
  hasOpenedExternal,
  countdownMs,
  onCopyAndOpen,
  canProceed,
  onBack,
  onNext,
}: Props) {
  const showGating = rating === 4 || rating === 5;
  const len = reviewText.trim().length;
  const canClickCopy = !!reviewUrl && len >= MIN_REVIEW_LEN;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="reviewText">Your review</Label>
        <Textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => onReviewTextChange(e.target.value)}
          placeholder="What did you like? What could be better?"
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          Minimum {MIN_REVIEW_LEN} characters. Tips: quality, assembly,
          delivery, value.
        </p>
      </div>
      {showGating && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onCopyAndOpen}
              disabled={!canClickCopy}
            >
              Copy &amp; open review page
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {len < MIN_REVIEW_LEN && (
              <span>
                Write at least <strong>{MIN_REVIEW_LEN}</strong> characters to
                enable the button ({len}/{MIN_REVIEW_LEN}).
              </span>
            )}
            {len >= MIN_REVIEW_LEN && (
              <>
                {hasOpenedExternal ? (
                  countdownMs > 0 ? (
                    <span>
                      Thanks! You can continue in{" "}
                      {Math.ceil(countdownMs / 1000)}s…
                    </span>
                  ) : (
                    <span>Great — you can continue now.</span>
                  )
                ) : (
                  <span>Click the button above to continue.</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}

// src/components/reviews/steps/StepUsageRating.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/reviews/StarRating";

type Rating = 1 | 2 | 3 | 4 | 5;

type Props = {
  used7Days: boolean;
  rating: Rating | null;
  onUsed7DaysChange: (value: boolean) => void;
  onRatingChange: (value: Rating) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function StepUsageRating({
  used7Days,
  rating,
  onUsed7DaysChange,
  onRatingChange,
  onBack,
  onNext,
}: Props) {
  const [triedNext, setTriedNext] = React.useState(false);

  const canProceed = Boolean(used7Days) && rating !== null;
  const showUsedError = triedNext && !used7Days;
  const showRatingError = triedNext && rating === null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Checkbox
            id="used7"
            checked={used7Days}
            onCheckedChange={(v) => onUsed7DaysChange(Boolean(v))}
            aria-invalid={showUsedError}
          />
          <Label htmlFor="used7">
            I’ve used the product for at least 5 days
          </Label>
        </div>
        {showUsedError && (
          <p className="text-xs text-destructive">
            Please confirm you’ve used the product for at least 5 days.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>How would you rate the product?</Label>
        <StarRating
          value={rating ?? 0}
          onChange={(v) => onRatingChange(v as Rating)}
        />
        {showRatingError && (
          <p className="text-xs text-destructive">
            Select a rating to continue.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (canProceed) onNext();
            else setTriedNext(true);
          }}
          disabled={false /* we let them click to show errors */}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

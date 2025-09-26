"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";

export type Rating = 1 | 2 | 3 | 4 | 5;

function StarRating({
  value,
  onChange,
}: {
  value: Rating | null;
  onChange: (v: Rating) => void;
}) {
  const stars: Rating[] = [1, 2, 3, 4, 5];

  return (
    <div
      className="flex items-center gap-2"
      role="radiogroup"
      aria-label="Rating"
    >
      {stars.map((n) => {
        const filled = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <Star
              className={`h-8 w-8 transition-transform ${
                filled ? "text-yellow-400" : "text-muted-foreground/60"
              }`}
              // solid gold when selected; outline gray when not
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function StepUsageRating({
  used7Days,
  rating,
  onUsed7DaysChange,
  onRatingChange,
  onBack,
  onNext,
}: {
  used7Days: boolean;
  rating: Rating | null;
  onUsed7DaysChange: (v: boolean) => void;
  onRatingChange: (v: Rating) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  // ✅ Require BOTH: checkbox ticked AND a rating selected
  const canContinue = Boolean(used7Days && rating);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Checkbox
          id="used7"
          checked={used7Days}
          onCheckedChange={(v) => onUsed7DaysChange(Boolean(v))}
          className="mt-1 h-5 w-5"
        />
        <Label htmlFor="used7" className="text-sm leading-snug">
          I’ve used this product for at least 7 days
        </Label>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">How many stars?</Label>
        <StarRating value={rating} onChange={onRatingChange} />
      </div>

      {!canContinue && (
        <p className="text-xs text-muted-foreground">
          Select a rating and tick the 7-day box to continue.
        </p>
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
          disabled={!canContinue}
          aria-disabled={!canContinue}
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

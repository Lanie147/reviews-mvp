"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className="flex items-center gap-2"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(null)}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              onChange(Math.min((value || 0) + 1, 5));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              onChange(Math.max((value || 0) - 1, 1));
            }
          }}
          className="p-1"
        >
          <Star
            className={`h-7 w-7 ${
              display >= n ? "text-yellow-500" : "text-muted-foreground/60"
            }`}
            fill={display >= n ? "currentColor" : "none"}
          />
        </button>
      ))}
      <span className="ml-1 text-sm text-muted-foreground min-w-[56px]">
        {value ? `${value} / 5` : "Select a rating"}
      </span>
    </div>
  );
}

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  email: string;
  marketingOptIn: boolean;
  onEmailChange: (value: string) => void;
  onMarketingOptInChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void | Promise<void>;
};

export default function StepContactConsent({
  email,
  marketingOptIn,
  onEmailChange,
  onMarketingOptInChange,
  onBack,
  onNext,
}: Props) {
  const canSubmit =
    email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          We’ll send your gift / support updates here. Leave blank if you
          prefer.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="optin"
          checked={marketingOptIn}
          onCheckedChange={(v) => onMarketingOptInChange(Boolean(v))}
        />
        <Label htmlFor="optin">
          I agree to receive occasional product updates and offers.
        </Label>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!canSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}

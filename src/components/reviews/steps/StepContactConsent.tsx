"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function StepContactConsent({
  email,
  marketingOptIn,
  onEmailChange,
  onMarketingOptInChange,
  onBack,
  onNext,
}: {
  email: string;
  marketingOptIn: boolean;
  onEmailChange: (v: string) => void;
  onMarketingOptInChange: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void; // parent triggers handleSubmit
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">
          Email (to send your gift)
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-12 text-base"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="optin"
          checked={marketingOptIn}
          onCheckedChange={(v) => onMarketingOptInChange(Boolean(v))}
          className="mt-1 h-5 w-5"
        />
        <Label
          htmlFor="optin"
          className="text-sm leading-snug text-muted-foreground"
        >
          Keep me in the loop about product tips and updates. You can
          unsubscribe anytime.
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1"
          onClick={onBack}
        >
          Back
        </Button>
        <Button type="button" className="h-12 flex-[2]" onClick={onNext}>
          Submit
        </Button>
      </div>
    </div>
  );
}

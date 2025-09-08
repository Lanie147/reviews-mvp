"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // run: npx shadcn add input
import { Textarea } from "@/components/ui/textarea"; // run: npx shadcn add textarea
import { Label } from "@/components/ui/label"; // run: npx shadcn add label
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // npx shadcn add radio-group
import { Checkbox } from "@/components/ui/checkbox"; // npx shadcn add checkbox
import { Progress } from "@/components/ui/progress"; // npx shadcn add progress
import { CheckCircle2 } from "lucide-react";

type Props = {
  campaign: {
    id: string;
    name: string;
    amazonUrl: string; // where we send them to post review
    marketplaceLabel: string;
  };
};

export default function ReviewWizard({ campaign }: Props) {
  const [step, setStep] = useState(1);

  // form state
  const [product, setProduct] = useState("");
  const [marketplace, setMarketplace] = useState(campaign.marketplaceLabel);
  const [orderNumber, setOrderNumber] = useState("");
  const [rating, setRating] = useState<number | undefined>(5);
  const [used7Days, setUsed7Days] = useState<boolean | undefined>(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);

  const [review, setReview] = useState("");
  const minChars = 40;
  const reviewOk = review.trim().length >= minChars;

  const pct = useMemo(() => [1, 2, 3, 4].indexOf(step) * 25 + 25, [step]);

  async function savePartial(nextStep: number) {
    // you can persist partials here if wanted
    setStep(nextStep);
  }

  async function finish() {
    // Save submission
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: campaign.id,
        product,
        marketplace,
        orderNumber,
        rating,
        used7Days,
        name,
        email,
        phone,
        optIn,
        reviewText: review,
      }),
    });

    // copy review text to clipboard (so they can paste on Amazon)
    if (review) {
      try {
        await navigator.clipboard.writeText(review);
      } catch {}
    }

    // open Amazon review page in a new tab
    if (campaign.amazonUrl) {
      window.open(campaign.amazonUrl, "_blank", "noopener,noreferrer");
    }

    setStep(4);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-center">{campaign.name}</CardTitle>
        <div className="mt-2">
          <Progress value={pct} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="text-center text-sm text-muted-foreground">
              Complete the form to get your free gift!
            </div>

            <div className="space-y-4">
              <div>
                <Label>Which product did you purchase?</Label>
                <Input
                  placeholder="e.g. Full Face Snorkel Mask"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              <div>
                <Label>Which marketplace did you purchase from?</Label>
                <Input
                  placeholder="e.g. United Kingdom"
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                />
              </div>

              <div>
                <Label>Amazon Order Number</Label>
                <Input
                  placeholder="555-1234567-0000000"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>

              <div>
                <Label>How happy are you with our product?</Label>
                <RadioGroup
                  className="mt-2"
                  value={String(rating ?? "")}
                  onValueChange={(v) => setRating(Number(v))}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <div key={r} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(r)} id={`r${r}`} />
                      <Label htmlFor={`r${r}`}>
                        {r === 5
                          ? "Very Satisfied"
                          : r === 4
                          ? "Somewhat Satisfied"
                          : r === 3
                          ? "Neither Satisfied Nor Dissatisfied"
                          : r === 2
                          ? "Somewhat Dissatisfied"
                          : "Very Dissatisfied"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>
                  Have you been using this product for more than 7 days?
                </Label>
                <RadioGroup
                  className="mt-2"
                  value={
                    used7Days === true ? "yes" : used7Days === false ? "no" : ""
                  }
                  onValueChange={(v) => setUsed7Days(v === "yes")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => savePartial(2)}>Continue</Button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="space-y-4">
              <div>
                <Label>Your name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>E-mail address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Phone number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optin"
                  checked={optIn}
                  onCheckedChange={(v) => setOptIn(Boolean(v))}
                />
                <Label htmlFor="optin">
                  Please send me special offers and samples
                </Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => savePartial(3)}>Continue</Button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <div className="space-y-3">
              <div className="text-center text-sm">
                Please share your experience
              </div>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
                placeholder="How do you like our product? Minimum 40 characters…"
              />
              <div className="text-xs text-muted-foreground">
                {Math.min(review.trim().length, minChars)}/{minChars} characters
              </div>

              <Button
                className="w-full"
                disabled={!reviewOk}
                onClick={finish}
                title={
                  !reviewOk
                    ? "Write at least 40 characters"
                    : "Copy & open Amazon"
                }
              >
                {reviewOk
                  ? "Copy & open Amazon"
                  : "Write at least 40 characters"}
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </>
        )}

        {/* STEP 4 — Thank you */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <div className="text-xl font-semibold">Thank you!</div>
            <p className="text-muted-foreground">
              We’ve saved your details. Paste your review on Amazon in the tab
              that opened.
            </p>

            <div className="mx-auto max-w-sm rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">
                Your coupon code
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-wider">
                SAVEBIG5
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                * Example only — replace with your real promo logic.
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setStep(1)} variant="outline">
                Start over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

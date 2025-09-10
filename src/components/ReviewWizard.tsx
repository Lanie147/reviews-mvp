// src/components/review-wizard/ReviewWizard.tsx
"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reviewSubmissionSchema,
  type ReviewSubmission,
} from "@/lib/validation/review";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CampaignProps = {
  id: string;
  name: string;
  marketplace: { platform: string; code: string; tld: string };
  target?: {
    platform: string;
    asin?: string;
    itemId?: string;
    placeId?: string;
    url?: string;
  };
};

type ProductOption = {
  asin: string;
  image: string;
  title: string;
};

const STEPS = [
  "Product & Order",
  "Usage & Rating",
  "Your Review",
  "Contact & Consent",
  "Confirm & Submit",
] as const;

export default function ReviewWizard({
  campaign,
  products,
}: {
  campaign: CampaignProps;
  products: ProductOption[];
}) {
  const [step, setStep] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const form = useForm<ReviewSubmission>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: {
      campaignId: campaign.id,
      campaignName: campaign.name,
      marketplace: campaign.marketplace,
      productName: "",
      orderNumber: "",
      used7Days: false,
      rating: 5,
      reviewText: "",
      email: undefined,
      marketingOptIn: false,
      target: undefined,
      ipHash: undefined,
      userAgent: undefined,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const LAST_STEP = STEPS.length - 1;
  const isFinalStep = step === LAST_STEP;
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const fieldsByStep: Record<number, (keyof ReviewSubmission)[]> = {
    0: ["productName", "orderNumber"],
    1: ["used7Days", "rating"],
    2: ["reviewText"],
    3: ["email", "marketingOptIn"],
    4: [], // summary
  };

  const next = async () => {
    const fields = fieldsByStep[step];

    // Special handling for step 1 (Usage & Rating)
    if (step === 1) {
      const used7Days = getValues("used7Days");
      if (!used7Days) {
        setStep(STEPS.length); // Early Review Warning screen
        return;
      }
    }

    const ok = await trigger(fields);
    if (!ok) return;
    setStep((s) => Math.min(s + 1, LAST_STEP)); // go to Summary on last increment
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: ReviewSubmission) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data?.errors) {
        data.errors.forEach((e: { path: string; message: string }) => {
          setError(e.path as any, { message: e.message });
        });
      }
      const firstErrorPath = data?.errors?.[0]?.path as
        | keyof ReviewSubmission
        | undefined;
      if (firstErrorPath) {
        const targetStep =
          Object.entries(fieldsByStep).find(([, arr]) =>
            arr.includes(firstErrorPath)
          )?.[0] ?? "0";
        setStep(parseInt(targetStep, 10));
      }
      return;
    }

    setSubmittedId(data.id ?? "ok");
    setStep(STEPS.length); // success screen
  };

  // Submit only from the final button; prevent implicit form submits on earlier steps
  const preventImplicitSubmit: React.FormEventHandler<HTMLFormElement> = (
    e
  ) => {
    if (!isFinalStep) e.preventDefault();
  };

  if (submittedId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-col items-center gap-2">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <CardTitle>Thanks for your submission!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>
            Your reference: <span className="font-mono">{submittedId}</span>
          </p>
          <p>We appreciate you taking the time to leave a review.</p>
        </CardContent>
      </Card>
    );
  }

  // Early Review Warning screen (sentinel)
  if (step === STEPS.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Please wait before reviewing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EarlyReviewWarning />
          <Button onClick={() => setStep(1)} variant="ghost">
            Go back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{campaign.name} — Review</CardTitle>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-4">
          <Progress value={progress} />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            {STEPS.map((label, idx) => (
              <div
                key={label}
                className={`truncate ${
                  idx === step ? "font-medium text-foreground" : ""
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={preventImplicitSubmit}
          className="space-y-6"
          onKeyDown={(e) => {
            // Enter should not submit before final step
            if (e.key === "Enter" && !isFinalStep) {
              e.preventDefault();
              if ((e.target as HTMLElement)?.tagName !== "TEXTAREA") next();
            }
          }}
        >
          {/* STEP 0: Product & Order */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Select your product</Label>
                <Select
                  onValueChange={(asin) => {
                    const product = products.find((p) => p.asin === asin);
                    if (!product) return;
                    form.setValue("productName", product.title, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    form.setValue(
                      "target",
                      {
                        platform: campaign.marketplace.platform,
                        asin: product.asin,
                      } as NonNullable<ReviewSubmission["target"]>,
                      { shouldValidate: false, shouldDirty: true }
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the product you ordered" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.asin} value={product.asin}>
                        <div className="flex items-center gap-2">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-10 h-10 object-contain"
                          />
                          <span className="text-sm">{product.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.productName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="orderNumber">Amazon order number</Label>
                <Input
                  id="orderNumber"
                  placeholder="123-1234567-1234567"
                  {...register("orderNumber")}
                />
                {errors.orderNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.orderNumber.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your Amazon order confirmation email.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Usage & Rating */}
          {step === 1 && (
            <div className="space-y-5">
              <Controller
                name="used7Days"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="used7Days"
                      checked={!!field.value}
                      onCheckedChange={(val) => field.onChange(Boolean(val))}
                    />
                    <Label htmlFor="used7Days">
                      I've used the product for at least 7 days
                    </Label>
                  </div>
                )}
              />
              {errors.used7Days && (
                <p className="text-red-500 text-sm">
                  {errors.used7Days.message}
                </p>
              )}

              <div>
                <Label htmlFor="rating">Rating (1–5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  {...register("rating", { valueAsNumber: true })}
                />
                {errors.rating && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rating.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Your Review */}
          {step === 2 && (
            <div>
              <Label htmlFor="reviewText">Your review</Label>
              <textarea
                id="reviewText"
                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Please share your experience with the product..."
                {...register("reviewText")}
              />
              {errors.reviewText && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.reviewText.message}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Contact & Consent */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email address (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="marketingOptIn"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="marketingOptIn"
                      checked={!!field.value}
                      onCheckedChange={(val) => field.onChange(Boolean(val))}
                    />
                  )}
                />
                <Label htmlFor="marketingOptIn">
                  I'd like to receive updates about future campaigns
                </Label>
              </div>
            </div>
          )}

          {/* STEP 4: Confirm & Submit (Summary) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4 space-y-2">
                <SummaryRow label="Product" value={getValues("productName")} />
                <SummaryRow
                  label="Order number"
                  value={getValues("orderNumber")}
                />
                <SummaryRow
                  label="Used ≥7 days"
                  value={getValues("used7Days") ? "Yes" : "No"}
                />
                <SummaryRow
                  label="Rating"
                  value={`${getValues("rating")} stars`}
                />
                <SummaryRow
                  label="Review"
                  value={
                    getValues("reviewText").length > 120
                      ? getValues("reviewText").slice(0, 120) + "…"
                      : getValues("reviewText")
                  }
                />
                <SummaryRow label="Email" value={getValues("email") ?? "—"} />
                <SummaryRow
                  label="Marketing opt-in"
                  value={getValues("marketingOptIn") ? "Yes" : "No"}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Please review your submission. Click “Confirm & Submit” when
                you're ready.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0 || isSubmitting}
            >
              Back
            </Button>

            {step < LAST_STEP ? (
              <Button type="button" onClick={next} disabled={isSubmitting}>
                Next
              </Button>
            ) : (
              // Submit ONLY from this button
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting…" : "Confirm & Submit"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-sm text-muted-foreground text-right">
        {value || "—"}
      </div>
    </div>
  );
}

function EarlyReviewWarning() {
  return (
    <div className="p-4 rounded-md bg-yellow-50 text-yellow-800">
      <h3 className="font-medium mb-2">Why do I need to wait?</h3>
      <p className="text-sm">
        Amazon may flag reviews left too soon after purchase. Please wait at
        least 7 days after receiving your product before leaving a review. This
        helps ensure your review appears genuine and stays published.
      </p>
    </div>
  );
}

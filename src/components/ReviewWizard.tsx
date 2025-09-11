"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Path } from "react-hook-form";
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
import { AlertCircle, CheckCircle2, ExternalLink, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image"; // ✅ use Next Image
import React from "react";

// --- Types ---

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
function StarRating({
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

// --- Popup‑safe helper ---
// Auto-format: 3-7-7 pattern for Amazon orders
function formatAmazonOrder(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 17); // 3 + 7 + 7 = 17 digits
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 10);
  const p3 = digits.slice(10, 17);
  let out = p1;
  if (p2) out += `-${p2}`;
  if (p3) out += `-${p3}`;
  return out;
}

export default function ReviewWizard({
  campaign,
  products,
}: {
  campaign: CampaignProps;
  products: ProductOption[];
}) {
  const [step, setStep] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [hasOpenedExternal, setHasOpenedExternal] = useState(false);
  const REQUIRED_DELAY_SEC = 10;
  const [openCountdown, setOpenCountdown] = useState(0);

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
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const LAST_STEP = STEPS.length - 1;
  const isFinalStep = step === LAST_STEP;
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  // --- Watchers for gating logic ---
  const rating = watch("rating");
  const reviewText = watch("reviewText");
  const target = watch("target");

  // If rating changes (eg 5 -> 3), reset the external gate
  useEffect(() => {
    setHasOpenedExternal(false);
    setOpenCountdown(0);
  }, [rating]);

  const needsExternalReview = useMemo(
    () => (Number(rating) || 0) >= 4,
    [rating]
  );
  const reviewUrl = useMemo(
    () => buildReviewUrl(campaign, target),
    [campaign, target]
  );

  const canProceedFromStep2 =
    !needsExternalReview || (hasOpenedExternal && openCountdown <= 0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fieldsByStep: Record<number, (keyof ReviewSubmission)[]> = {
    0: ["productName", "orderNumber"],
    1: ["used7Days", "rating"],
    2: ["reviewText"],
    3: ["email", "marketingOptIn"],
    4: [], // summary
  };
  useEffect(() => {
    if (!hasOpenedExternal || openCountdown <= 0) return;
    const id = setInterval(
      () => setOpenCountdown((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [hasOpenedExternal, openCountdown]);

  const next = async () => {
    // Gate Step 2 for 4–5★: must have clicked Copy & Open
    if (step === 2 && !canProceedFromStep2) return;

    const fields = fieldsByStep[step];

    // Special handling for step 1 (Usage & Rating)
    if (step === 1) {
      const used7Days = getValues("used7Days");
      if (!used7Days) {
        setStep(STEPS.length); // Early Review Warning screen
        return;
      }
    }

    const ok = await trigger(fields as Path<ReviewSubmission>[], {
      shouldFocus: true,
    });
    if (!ok) return;
    setStep((s) => Math.min(s + 1, LAST_STEP));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: ReviewSubmission) => {
    setSubmitError(null); // clear any previous error

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Avoid any odd caching on some mobile browsers
        cache: "no-store",
        body: JSON.stringify(values),
      });

      // Be resilient: the response may not always be JSON (e.g., 500 HTML)
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        // Server-side validation errors (422/409/404) -> show inline + jump to step
        if (data?.errors?.length) {
          data.errors.forEach((e: { path: string; message: string }) => {
            setError(e.path as Path<ReviewSubmission>, { message: e.message });
          });
          const firstErrorPath = data.errors[0]?.path as
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

        // Non-validation failure: show a friendly message
        setSubmitError(
          (data?.error as string) ||
            `Submission failed (${res.status}). Please try again.`
        );
        return;
      }

      const id = (data && data.id) || "ok";
      setSubmittedId(id);
      setStep(STEPS.length); // success screen
    } catch (err) {
      // Network/JSON parse/etc.
      setSubmitError(
        "We couldn’t submit due to a network error. Please check your connection and try again."
      );
    }
  };

  // Prevent implicit submit before final step
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

  // Early Review Warning screen
  if (step === STEPS.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Please wait before reviewing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-yellow-50 text-yellow-800">
            <h3 className="font-medium mb-2">Why do I need to wait?</h3>
            <p className="text-sm">
              Amazon&apos;s systems may flag reviews left too soon after
              purchase. Please wait at least 7 days after receiving your product
              before leaving a review. This helps ensure your review appears
              genuine and stays published.
            </p>
          </div>
          <Button onClick={() => setStep(1)} variant="ghost">
            Go back
          </Button>
        </CardContent>
      </Card>
    );
  }
  const canOpen = Boolean(reviewUrl) && Boolean(reviewText?.trim());

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

                    // Store the visible label (you already had this)
                    form.setValue("productName", product.title, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    // ✅ Force a normalized target shape for later steps
                    form.setValue(
                      "target",
                      {
                        platform: "amazon", // force normalized lowercase string
                        asin: product.asin,
                        url: undefined,
                        itemId: undefined,
                        placeId: undefined,
                      } as NonNullable<ReviewSubmission["target"]>,
                      { shouldValidate: false, shouldDirty: true }
                    );

                    // Optional: if you want to make sure watchers see it immediately:
                    // void form.trigger("target");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the product you ordered" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.asin} value={product.asin}>
                        <div className="flex items-center gap-2">
                          <Image
                            src={product.image}
                            alt={product.title}
                            width={40}
                            height={40}
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

                <Controller
                  name="orderNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="orderNumber"
                      // Keep as text so we can include dashes
                      type="text"
                      inputMode="numeric" // mobile shows number keypad
                      pattern="\d*" // hint for numeric
                      maxLength={19} // 17 digits + 2 dashes
                      placeholder="123-1234567-1234567"
                      autoComplete="one-time-code"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const formatted = formatAmazonOrder(e.target.value);
                        field.onChange(formatted);
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text") || "";
                        field.onChange(formatAmazonOrder(text));
                      }}
                      onBlur={(e) => {
                        // Reformat again on blur (in case of odd edits)
                        const formatted = formatAmazonOrder(e.target.value);
                        field.onChange(formatted);
                        field.onBlur();
                      }}
                      aria-invalid={!!errors.orderNumber}
                    />
                  )}
                />

                {errors.orderNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.orderNumber.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Format: 123-1234567-1234567 (find it in your Amazon order
                  email).
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
                      I&apos;ve used the product for at least 7 days
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
                <Label htmlFor="rating">Rating</Label>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <StarRating
                      value={Number(field.value) || 0}
                      onChange={(n) => field.onChange(n)}
                    />
                  )}
                />
                {errors.rating && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.rating.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Your Review + (4–5★) external nudge */}
          {step === 2 && (
            <div className="space-y-3">
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

              {needsExternalReview && (
                <div
                  className={`rounded-xl border p-4 ${
                    hasOpenedExternal
                      ? "border-green-500/40"
                      : "border-amber-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {hasOpenedExternal ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5" />
                    )}
                    <div className="space-y-2">
                      <p className="font-medium">
                        Great! Would you share this on the official review page?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tap the button to open the product&apos;s review page in
                        a new tab and copy your text. After that, you can
                        continue.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {canOpen ? (
                          // Render an anchor ONLY when we have a real URL
                          <Button asChild>
                            <a
                              href={reviewUrl as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                const text = (reviewText || "").trim();
                                if (text && navigator?.clipboard?.writeText) {
                                  navigator.clipboard
                                    .writeText(text)
                                    .catch(() => {});
                                }
                                setHasOpenedExternal(true);
                                setOpenCountdown(REQUIRED_DELAY_SEC); // 👈 start delay
                              }}
                            >
                              Copy & open review page{" "}
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          // If we don't have a URL or text yet, render a non-clickable button (no <a>, no "#")
                          <Button type="button" disabled>
                            Copy & open review page{" "}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {hasOpenedExternal && (
                        <p className="text-xs text-green-700">
                          {openCountdown > 0
                            ? `Great — you can continue in ${openCountdown}s…`
                            : "Thanks! You can now continue."}
                        </p>
                      )}
                      {/* Helpful hints */}
                      {!reviewUrl && (
                        <p className="text-xs text-amber-600 mt-1">
                          Select your product above so we can open the right
                          review page.
                        </p>
                      )}

                      {reviewUrl && !reviewText?.trim() && (
                        <p className="text-xs text-amber-600 mt-1">
                          Add some review text to enable the button.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                  I&apos;d like to receive updates about future campaigns
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
                Please review your submission. Click &ldquo;Confirm &amp;
                Submit&rdquo; when you&apos;re ready.
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
              <Button
                type="button"
                onClick={next}
                disabled={isSubmitting || (step === 2 && !canProceedFromStep2)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting…" : "Confirm & Submit"}
              </Button>
            )}
            {submitError && (
              <p
                className="text-sm text-red-600 mt-2"
                role="alert"
                aria-live="polite"
              >
                {submitError}
              </p>
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

// --- Helpers ---

function buildReviewUrl(
  campaign: CampaignProps,
  currentTarget?: ReviewSubmission["target"]
): string | null {
  const t = currentTarget ?? campaign.target;
  if (!t) return null;

  // If a direct URL was provided, prefer it
  const direct = t.url?.trim();
  if (direct) return direct;

  // Normalize platform + tld safely
  const platform = (t.platform || campaign.marketplace?.platform || "")
    .toLowerCase()
    .trim();
  const tld = (campaign.marketplace?.tld || "co.uk").trim();

  switch (platform) {
    case "amazon": {
      const asin = t.asin?.trim();
      if (asin && asin.length >= 10) {
        return `https://www.amazon.${tld}/review/create-review?asin=${encodeURIComponent(
          asin
        )}`;
      }
      return null;
    }

    case "google": {
      const placeId = t.placeId?.trim();
      if (placeId) {
        return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(
          placeId
        )}`;
      }
      return null;
    }

    case "ebay": {
      const itemId = t.itemId?.trim();
      if (itemId) {
        return `https://www.ebay.co.uk/itm/${encodeURIComponent(itemId)}`;
      }
      return null;
    }

    default:
      return null;
  }
}

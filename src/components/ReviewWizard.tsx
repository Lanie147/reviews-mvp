// src/components/ReviewWizard.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProductOption } from "@/components/reviews/steps/StepProductOrder";

import StepProductOrder from "@/components/reviews/steps/StepProductOrder";
import StepUsageRating from "@/components/reviews/steps/StepUsageRating";
import StepYourReview from "@/components/reviews/steps/StepYourReview";
import StepContactConsent from "@/components/reviews/steps/StepContactConsent";
import StepSummary from "@/components/reviews/steps/StepSummary";

import { formatAmazonOrderLive, buildReviewUrl } from "@/lib/review-helpers";

// ✅ Use shared types from lib (single source of truth)
import type { CampaignProps, ReviewTargetLite } from "@/lib/review-helpers";

type Rating = 1 | 2 | 3 | 4 | 5;

export interface WizardForm {
  product?: ProductOption | null;
  orderNumber: string;
  used7Days: boolean;
  rating: Rating | null;
  reviewText: string;
  email?: string;
  marketingOptIn: boolean;
  target?: ReviewTargetLite | null;
  hasOpenedExternal: boolean;
  countdownMs: number;
}

type Props = {
  campaign: CampaignProps;
  // Optional: if you have multiple product options; otherwise we infer from campaign
  productOptions?: ProductOption[];
};

// ----- Component -----
export default function ReviewWizard({ campaign, productOptions }: Props) {
  // Steps: 0..4 (5 steps)
  const [step, setStep] = useState<number>(0);

  const [form, setForm] = useState<WizardForm>({
    product: campaign.asin
      ? {
          id: campaign.asin,
          name: campaign.productName,
          asin: campaign.asin,
          imageUrl: campaign.imageUrl ?? undefined,
        }
      : null,
    orderNumber: "",
    used7Days: false,
    rating: null,
    reviewText: "",
    email: "",
    marketingOptIn: false,
    target:
      campaign.reviewTargets?.find((t) => t.isPrimary) ??
      campaign.reviewTargets?.[0] ??
      null,
    hasOpenedExternal: false,
    countdownMs: 0,
  });

  // Timer for gating “Next” after opening review page
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepsTotal = 5;
  const progress = useMemo(
    () => ((step + 1) / stepsTotal) * 100,
    [step, stepsTotal]
  );
  const effectiveProductOptions = useMemo<ProductOption[]>(() => {
    // if parent passed options, use them
    if (productOptions && productOptions.length > 0) return productOptions;

    // fallback to campaign-level ASIN so the Select always has at least one item
    if (campaign.asin) {
      return [
        {
          id: campaign.asin,
          name: campaign.productName,
          asin: campaign.asin,
          imageUrl: campaign.imageUrl ?? null,
        },
      ];
    }
    return [];
  }, [productOptions, campaign.asin, campaign.productName, campaign.imageUrl]);
  // Derived list of targets

  // Build review URL for the chosen target
  const reviewUrl = useMemo<string | null>(() => {
    const asin = form.product?.asin ?? campaign.asin ?? null;
    if (!asin) return null;

    // synthetic Amazon target (since all are Amazon)
    const syntheticTarget: ReviewTargetLite = {
      id: "amazon-default",
      platform: "AMAZON",
      asin,
      itemId: null,
      placeId: null,
      url: null,
      title: campaign.productName,
      image: campaign.imageUrl ?? null,
      isPrimary: true,
    };

    return buildReviewUrl({
      target: syntheticTarget,
      marketplace: campaign.marketplace ?? {
        platform: "AMAZON",
        code: "UK",
        tld: "co.uk",
        externalId: null,
      },
      asin,
      productName: campaign.productName,
    });
  }, [
    form.product?.asin,
    campaign.asin,
    campaign.productName,
    campaign.imageUrl,
    campaign.marketplace,
  ]);

  // Countdown logic (for 4–5★ gating)
  const startCountdown = useCallback((ms: number) => {
    // Clear any existing
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setForm((f) => ({ ...f, countdownMs: ms }));
    countdownRef.current = setInterval(() => {
      setForm((f) => {
        const next = Math.max(0, f.countdownMs - 1000);
        if (next === 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return { ...f, countdownMs: next };
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Handlers
  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, stepsTotal - 1));
  }, [stepsTotal]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const setRating = useCallback((value: Rating) => {
    setForm((f) => ({ ...f, rating: value }));
  }, []);

  const setOrderNumber = useCallback((value: string) => {
    setForm((f) => ({ ...f, orderNumber: formatAmazonOrderLive(value) }));
  }, []);

  const setUsed7Days = useCallback((value: boolean) => {
    setForm((f) => ({ ...f, used7Days: value }));
  }, []);

  const setReviewText = useCallback((value: string) => {
    setForm((f) => ({ ...f, reviewText: value }));
  }, []);

  const setEmail = useCallback((value: string) => {
    setForm((f) => ({ ...f, email: value.trim().toLowerCase() }));
  }, []);

  const setMarketingOptIn = useCallback((value: boolean) => {
    setForm((f) => ({ ...f, marketingOptIn: value }));
  }, []);

  const selectProductById = useCallback(
    (id: string) => {
      const options: ProductOption[] =
        productOptions ??
        (campaign.asin
          ? [
              {
                id: campaign.asin,
                name: campaign.productName,
                asin: campaign.asin,
                imageUrl: campaign.imageUrl ?? undefined,
              },
            ]
          : []);
      const found = options.find((p) => p.id === id) ?? null;
      setForm((f) => ({ ...f, product: found }));
    },
    [productOptions, campaign.asin, campaign.imageUrl, campaign.productName]
  );
  const asinForTracking = form.product?.asin ?? campaign.asin ?? null;
  const handleCopyAndOpen = useCallback(async () => {
    if (!reviewUrl) return;

    try {
      await navigator.clipboard.writeText(form.reviewText || "");
    } catch {
      // ignore clipboard errors
    }

    setForm((f) => ({ ...f, hasOpenedExternal: true }));
    startCountdown(10_000); // your existing 10s countdown

    // Fire-and-forget tracking (no await so UX stays snappy)
    if (asinForTracking) {
      void fetch("/api/track/review-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: asinForTracking,
          productName: campaign.productName ?? null,
          campaignId: campaign.id ?? null,
        }),
      }).catch(() => {});
    }

    window.open(reviewUrl, "_blank", "noopener,noreferrer");
  }, [
    reviewUrl,
    form.reviewText,
    asinForTracking,
    campaign.productName,
    campaign.id,
    startCountdown,
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const MIN_REVIEW_LEN = 40;
  const canProceedFromReviewStep = useMemo(() => {
    const hasMin = form.reviewText.trim().length >= MIN_REVIEW_LEN;
    if (form.rating === 4 || form.rating === 5) {
      return hasMin && form.hasOpenedExternal && form.countdownMs === 0;
    }
    return hasMin;
  }, [form.reviewText, form.rating, form.hasOpenedExternal, form.countdownMs]);
  const handleSubmit = useCallback(async () => {
    const campaignId = campaign.id ?? form.product?.id; // <- use picked product’s campaign id on /r
    // Build the submission payload
    const payload = {
      campaignId, // <-- use this
      campaignName: campaign.name,
      productName: campaign.productName,
      marketplace: campaign.marketplace ?? {
        platform: "AMAZON",
        code: "UK",
        tld: "co.uk",
      },
      rating: form.rating,
      used7Days: form.used7Days,
      reviewText: form.reviewText,
      orderNumber: form.orderNumber,
      email: form.email,
      marketingOptIn: form.marketingOptIn,
    };
    setSubmitError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Submit failed (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        setSubmitError(msg); // show this near the button
        return;
      }
      // Success → next
      goNext();
    } catch {
      // Network error → surface if needed
    }
  }, [
    campaign.id,
    campaign.name,
    campaign.productName,
    campaign.marketplace,
    form,
    goNext,
  ]);

  // ----- Render current step -----
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{campaign.productName} — Leave a Review</span>
          <span className="text-sm font-normal">
            {step + 1} / {stepsTotal}
          </span>
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && (
          <StepProductOrder
            product={form.product ?? null}
            productOptions={effectiveProductOptions} // <-- use fallback-backed options
            orderNumber={form.orderNumber}
            onSelectProduct={selectProductById}
            onOrderNumberChange={setOrderNumber}
            onNext={goNext}
          />
        )}

        {/* Step 1: Usage + Rating (no copy/open here) */}
        {step === 1 && (
          <StepUsageRating
            used7Days={form.used7Days}
            rating={form.rating}
            onUsed7DaysChange={setUsed7Days}
            onRatingChange={setRating}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {/* Step 2: Write review (copy/open + countdown now here) */}
        {step === 2 && (
          <StepYourReview
            rating={form.rating}
            reviewText={form.reviewText}
            onReviewTextChange={setReviewText}
            reviewUrl={reviewUrl}
            hasOpenedExternal={form.hasOpenedExternal}
            countdownMs={form.countdownMs}
            onCopyAndOpen={handleCopyAndOpen}
            canProceed={canProceedFromReviewStep}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === 3 && (
          <>
            <StepContactConsent
              email={form.email ?? ""}
              marketingOptIn={form.marketingOptIn}
              onEmailChange={setEmail}
              onMarketingOptInChange={setMarketingOptIn}
              onBack={goBack}
              onNext={handleSubmit}
            />

            {submitError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {submitError}
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <StepSummary
            campaignName={campaign.name}
            rating={form.rating}
            reviewText={form.reviewText}
            email={form.email ?? ""}
          />
        )}
      </CardContent>
    </Card>
  );
}

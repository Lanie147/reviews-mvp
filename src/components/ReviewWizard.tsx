// src/components/ReviewWizard.tsx (mobile-friendly, preserves your logic + confetti on submit)
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

/**
 * Tiny hook to fire celebratory confetti from the top of the screen.
 * Uses a dynamic import to avoid SSR issues.
 * Install once:  npm i canvas-confetti
 */
function useConfetti() {
  const firingRef = useRef(false);

  // 🇬🇧 / 🇫🇷 style red-white-blue (tweak to your exact brand hexes)
  const COLORS = useMemo(() => ["#0052A5", "#FFFFFF", "#D0021B"], []);
  return useCallback(
    async (opts?: { anchor?: HTMLElement | null; durationMs?: number }) => {
      if (firingRef.current) return;
      firingRef.current = true;

      const confetti = (await import("canvas-confetti")).default;
      const { anchor = null, durationMs = 1600 } = opts || {};

      // compute origin from bottom of the anchor/card
      let startY = 0.9;
      if (anchor && typeof window !== "undefined") {
        const rect = anchor.getBoundingClientRect();
        startY = Math.min(
          0.98,
          Math.max(0.05, rect.bottom / window.innerHeight)
        );
      }

      const end = Date.now() + durationMs;

      // sweeping bursts across the screen
      const columns = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9];
      columns.forEach((x, i) => {
        setTimeout(() => {
          confetti({
            particleCount: 40,
            startVelocity: 55,
            spread: 80,
            angle: 90,
            ticks: 200,
            origin: { x, y: startY },
            scalar: 0.9,
            colors: COLORS, // 👈 add colors here
            shapes: ["square", "circle"], // optional variety
          });
        }, i * 90);
      });

      // drizzle for the duration
      (function frame() {
        confetti({
          particleCount: 12,
          startVelocity: 45,
          spread: 70,
          angle: 90,
          ticks: 160,
          origin: { x: Math.random(), y: startY },
          scalar: 0.85,
          colors: COLORS, // 👈 and here
        });
        if (Date.now() < end) requestAnimationFrame(frame);
        else firingRef.current = false;
      })();
    },
    [COLORS]
  );
}

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

  // Anchor element for confetti origin (bottom of the card)
  const cardAnchorRef = useRef<HTMLDivElement | null>(null);

  const stepsTotal = 5;
  const progress = useMemo(
    () => ((step + 1) / stepsTotal) * 100,
    [step, stepsTotal]
  );
  const effectiveProductOptions = useMemo<ProductOption[]>(() => {
    // If parent passed options (from /r), use them (they already have real campaign ids)
    if (productOptions?.length) return productOptions;

    // Fallback for product-specific pages: build a single option from the current campaign
    if (campaign.id && campaign.asin) {
      return [
        {
          id: campaign.id, // <-- real campaign id, not ASIN
          name: campaign.productName,
          asin: campaign.asin,
          imageUrl: campaign.imageUrl ?? null,
        },
      ];
    }
    return [];
  }, [
    productOptions,
    campaign.id,
    campaign.asin,
    campaign.productName,
    campaign.imageUrl,
  ]);

  // 2) Auto-select first option if none chosen (prevents "Please pick a product")
  useEffect(() => {
    if (!form.product && effectiveProductOptions.length > 0) {
      setForm((f) => ({ ...f, product: effectiveProductOptions[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProductOptions]);

  // 3) Use the effective list when selecting by id
  const selectProductById = useCallback(
    (id: string) => {
      const found = effectiveProductOptions.find((p) => p.id === id) ?? null;
      setForm((f) => ({ ...f, product: found }));
    },
    [effectiveProductOptions]
  );
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

  const asinForTracking = form.product?.asin ?? campaign.asin ?? null;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const MIN_REVIEW_LEN = 40;
  const canProceedFromReviewStep = useMemo(() => {
    const hasMin = form.reviewText.trim().length >= MIN_REVIEW_LEN;
    if (form.rating === 4 || form.rating === 5) {
      return hasMin && form.hasOpenedExternal && form.countdownMs === 0;
    }
    return hasMin;
  }, [form.reviewText, form.rating, form.hasOpenedExternal, form.countdownMs]);

  // 🎉 Confetti hook instance
  const fireConfetti = useConfetti();

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

  const handleSubmit = useCallback(async () => {
    const isSynthetic = !campaign.id || campaign.slug === "global";
    const campaignId = isSynthetic ? form.product?.id : campaign.id;

    if (!campaignId) {
      setSubmitError?.("Please pick a product first.");
      return;
    }

    const payload = {
      campaignId,
      campaignName: campaign.name,
      productName: form.product?.name ?? campaign.productName,
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
    } as const;

    setSubmitError(null);

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
      setSubmitError(msg);
      return;
    }

    // 🎉 Fire confetti and move to summary
    fireConfetti({ anchor: cardAnchorRef.current, durationMs: 1800 });
    goNext();
  }, [
    campaign.id,
    campaign.slug,
    campaign.name,
    campaign.productName,
    campaign.marketplace,
    form,
    fireConfetti,
    goNext,
  ]);

  // ----- Render current step -----
  return (
    <div className="w-full mx-auto max-w-screen-sm">
      {/* Sticky top bar (mobile friendly) */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-semibold truncate">
              {`${
                form.product?.name ??
                campaign.productName ??
                "Choose your product"
              } - Review`}
            </h1>
            <span className="text-xs text-muted-foreground">
              {step + 1} / {stepsTotal}
            </span>
          </div>
          <Progress
            value={progress}
            className="mt-2 h-2"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Main card */}
      <div ref={cardAnchorRef}>
        <Card className="mx-3 my-4 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">
              {form.product?.name ??
                campaign.productName ??
                "Choose your product"}
            </CardTitle>
            {/* Progress is now in the sticky bar; keep header slim */}
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6 px-3 sm:px-6">
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
                canCopyOpen={!!reviewUrl && !!form.reviewText}
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
      </div>
    </div>
  );
}

/*
Optional (globals.css):
html { -webkit-tap-highlight-color: transparent; }
body { padding-bottom: env(safe-area-inset-bottom); }
*/

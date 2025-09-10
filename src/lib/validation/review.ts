import { z } from "zod";

// Amazon order number: 123-1234567-1234567
const amazonOrderRegex = /^\d{3}-\d{7}-\d{7}$/;

export const marketplaceSchema = z.object({
  platform: z.string().trim().min(2).max(40), // e.g., "amazon"
  code: z.string().trim().min(2).max(24), // e.g., "amazon-uk"
  tld: z.string().trim().min(2).max(12), // e.g., "co.uk"
});

export const targetSchema = z
  .object({
    platform: z.string().trim().min(2).max(40),
    asin: z.string().trim().length(10).optional(),
    itemId: z.string().trim().optional(),
    placeId: z.string().trim().optional(),
    url: z.string().trim().url("Enter a valid URL").optional(),
  })
  .partial()
  .refine((t) => !!(t.asin || t.itemId || t.placeId || t.url), {
    message:
      "Provide at least one target identifier (ASIN, itemId, placeId, or URL).",
  });

export // Define your Zod schema
const reviewSubmissionSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),

  marketplace: marketplaceSchema,
  productName: z.string().min(1, "Product name is required"),
  selectedProduct: z
    .object({
      asin: z.string(),
      image: z.string(),
      title: z.string(),
    })
    .optional(),
  orderNumber: z
    .string()
    .regex(amazonOrderRegex, "Please enter a valid Amazon order number"),
  used7Days: z.boolean().refine((val) => val === true, {
    message:
      "You must have used the product for at least 7 days to leave a review",
  }),
  rating: z.number(),
  reviewText: z
    .string()
    .min(40, "Review must be at least 40 characters")
    .max(2000, "Review must not exceed 2000 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .or(z.literal(""))
    .optional(),
  marketingOptIn: z.boolean(),
  target: targetSchema.optional(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
});

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;

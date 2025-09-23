import { z } from "zod";

export const campaignCreateSchema = z.object({
  name: z.string().min(2, "Campaign name is required").max(80),
  productName: z.string().min(2, "Product name is required").max(120),
  asin: z
    .string()
    .regex(/^[A-Z0-9]{10}$/i, "ASIN must be 10 alphanumeric characters"),
  imageUrl: z.string().url("Please enter a valid image URL"),
});

export type CampaignCreate = z.infer<typeof campaignCreateSchema>;

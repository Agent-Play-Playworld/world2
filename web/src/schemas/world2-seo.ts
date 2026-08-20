import { z } from "zod";

export const World2SeoFaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(40),
});

export type World2SeoFaqItem = z.infer<typeof World2SeoFaqItemSchema>;

export const World2SeoPageSchema = z.object({
  path: z.string().min(1),
  title: z.string().min(30).max(65),
  description: z.string().min(110).max(160),
  indexable: z.boolean(),
  changeFrequency: z.enum(["daily", "weekly", "monthly"]),
  priority: z.number().min(0).max(1),
});

export type World2SeoPage = z.infer<typeof World2SeoPageSchema>;

export const World2SeoSchema = z.object({
  brandName: z.literal("World 2"),
  siteName: z.string().min(1),
  legalName: z.string().min(1),
  defaultTitle: z.string().min(40).max(65),
  defaultDescription: z.string().min(110).max(160),
  keywords: z.array(z.string().min(1)).min(8),
  locale: z.literal("en_US"),
  themeColor: z.string().min(4),
  ogImagePath: z.string().min(1),
  ogImageAlt: z.string().min(1),
});

export type World2Seo = z.infer<typeof World2SeoSchema>;

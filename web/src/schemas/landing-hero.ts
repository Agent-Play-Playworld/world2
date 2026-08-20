import { z } from "zod";

export const LandingHeroCtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

export const LandingHeroSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  citizenshipCta: LandingHeroCtaSchema,
  sellApuCta: LandingHeroCtaSchema,
});

export type LandingHero = z.infer<typeof LandingHeroSchema>;
export type LandingHeroCta = z.infer<typeof LandingHeroCtaSchema>;

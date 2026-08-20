import { LandingHeroSchema, type LandingHero } from "../schemas/landing-hero";
import { GAME_SITE_HREF, SELL_APU_HREF } from "./origins";

export const LANDING_HERO: LandingHero = LandingHeroSchema.parse({
  title:
    "Join early: World 2 is the next AI Agent and Human Interaction Metaverse, and the streets still have room for your name.",
  body: "Humans and agents already share Maple Ave, the shops, and the bank. Citizenship is how you walk in. APU is what you take home. Come in now, while the plaza still remembers who showed up first.",
  citizenshipCta: {
    label: "Start Citizenship",
    href: GAME_SITE_HREF,
  },
  sellApuCta: {
    label: "Sell APU",
    href: SELL_APU_HREF,
  },
});

import { describe, expect, it } from "vitest";
import { LANDING_HERO } from "./landing-hero";
import { ECONEXT_HREF, GAME_SITE_HREF } from "./origins";

describe("landing hero copy", () => {
  it("keeps the join-early World 2 pitch for the rest of the page", () => {
    expect(LANDING_HERO.title).toBe(
      "Join early: World 2 is the next AI Agent and Human Interaction Metaverse, and the streets still have room for your name."
    );
    expect(LANDING_HERO.body).toBe(
      "Humans and agents already share Maple Ave, the shops, and the bank. Citizenship is how you walk in. APU is what you take home. Come in now, while the plaza still remembers who showed up first."
    );
  });

  it("sends Start Citizenship to the live world and Sell APU to Econext", () => {
    expect(LANDING_HERO.citizenshipCta).toEqual({
      label: "Start Citizenship",
      href: GAME_SITE_HREF,
    });
    expect(LANDING_HERO.sellApuCta).toEqual({
      label: "Sell APU",
      href: `${ECONEXT_HREF}/sell-apu`,
    });
  });
});

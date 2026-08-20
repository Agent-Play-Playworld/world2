import { describe, expect, it } from "vitest";
import { ECONEXT_HREF } from "./origins";
import { MONEY_FLOW_STEPS } from "./money-flow";

describe("Agent Play money flow", () => {
  it("walks earnings from the streets to the bank in one sequence", () => {
    const ids = MONEY_FLOW_STEPS.map((step) => step.id);
    expect(ids).toEqual([
      "walk-in",
      "arcade",
      "shops",
      "talk",
      "invite",
      "bundles",
      "owners",
      "bank",
    ]);
  });

  it("opens play with world dollars that stay in the world", () => {
    const walkIn = MONEY_FLOW_STEPS[0];
    expect(walkIn?.body).toMatch(/\$10/);
    expect(walkIn?.body).toMatch(/APW\$/);
    expect(walkIn?.body).not.toMatch(/withdraw as ordinary cash/i);
  });

  it("earns arcade units on Maple Ave inside the daily cap", () => {
    const arcade = MONEY_FLOW_STEPS.find((step) => step.id === "arcade");
    expect(arcade?.body).toMatch(/100 APU/);
    expect(arcade?.body).toMatch(/Maple Ave/);
  });

  it("sends bankable units to Econext, not a second occupancy host", () => {
    const bank = MONEY_FLOW_STEPS.find((step) => step.id === "bank");
    expect(bank?.href).toBe(ECONEXT_HREF);
    expect(bank?.hrefLabel).toMatch(/Econext/i);
    expect(bank?.body).toMatch(/bankable/i);
    expect(bank?.body).not.toMatch(/instant/i);
  });
});

import { describe, expect, it } from "vitest";
import { parallaxOffset } from "./parallax";

describe("parallax offset", () => {
  it("moves a slower layer less than the scroll distance", () => {
    expect(
      parallaxOffset({
        scrollY: 400,
        speed: 0.35,
      })
    ).toBe(140);
  });

  it("keeps a locked layer still", () => {
    expect(
      parallaxOffset({
        scrollY: 800,
        speed: 0,
      })
    ).toBe(0);
  });
});

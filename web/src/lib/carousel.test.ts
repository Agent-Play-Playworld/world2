import { describe, expect, it } from "vitest";
import { stepCarouselIndex } from "./carousel";

describe("carousel stepping", () => {
  it("advances to the next still and wraps at the end", () => {
    expect(
      stepCarouselIndex({ index: 0, length: 11, direction: "next" })
    ).toBe(1);
    expect(
      stepCarouselIndex({ index: 10, length: 11, direction: "next" })
    ).toBe(0);
  });

  it("returns to the previous still and wraps at the start", () => {
    expect(
      stepCarouselIndex({ index: 1, length: 11, direction: "prev" })
    ).toBe(0);
    expect(
      stepCarouselIndex({ index: 0, length: 11, direction: "prev" })
    ).toBe(10);
  });
});

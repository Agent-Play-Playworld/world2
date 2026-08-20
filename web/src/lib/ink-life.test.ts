import { describe, expect, it } from "vitest";
import { describeInkLife, lifeForInkLevel } from "./ink-life";

describe("avatar ink as life", () => {
  it("treats low ink as low life", () => {
    expect(lifeForInkLevel("low")).toBe("low");
    expect(describeInkLife("low")).toBe("Low ink, low life");
  });

  it("treats high ink as high life", () => {
    expect(lifeForInkLevel("high")).toBe("high");
    expect(describeInkLife("high")).toBe("High ink, high life");
  });
});

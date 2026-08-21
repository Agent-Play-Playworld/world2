import { describe, expect, it } from "vitest";
import {
  INDUCTION_BUSY_LABEL,
  INDUCTION_GATES,
  INDUCTION_NEXT,
  inductionStreetSrc,
  recoveryKeyWords,
} from "./citizenship-induction";

describe("citizen induction", () => {
  it("puts two labeled doors on the counter so the next move is obvious", () => {
    expect(INDUCTION_GATES.map((gate) => gate.action)).toEqual([
      "Start citizenship",
      "I already have credentials",
    ]);
    expect(INDUCTION_NEXT.welcome).toMatch(/pick a door/i);
  });

  it("prints the recovery key as ten tear-off words", () => {
    expect(
      recoveryKeyWords(
        "amber angle apple arch atlas aura autumn bamboo beacon birch"
      )
    ).toHaveLength(10);
  });

  it("tells returning citizens to open or drop credentials.json", () => {
    expect(INDUCTION_NEXT.restore).toMatch(/credentials\.json/i);
    expect(INDUCTION_NEXT.restore).toMatch(/drop/i);
    expect(INDUCTION_GATES[1]?.hint).toMatch(/open credentials\.json/i);
  });

  it("names the loading copy for stamp, restore, and street", () => {
    expect(INDUCTION_BUSY_LABEL["become-citizen"]).toMatch(/becoming a citizen/i);
    expect(INDUCTION_BUSY_LABEL.restore).toMatch(/checking papers/i);
    expect(INDUCTION_BUSY_LABEL["enter-world"]).toMatch(/entering world/i);
  });

  it("opens a different street still at each desk stop", () => {
    expect(inductionStreetSrc("welcome")).toContain("community-world-plaza");
    expect(inductionStreetSrc("sealed")).toContain("come-out-earn-take-it-home");
  });
});

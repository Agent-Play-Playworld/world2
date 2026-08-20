import { describe, expect, it } from "vitest";
import { COMPACT_PLAY_CHROME_QUERY, PLAY_FOOTER_MENU, PLAY_TOUCH_KEYS, isCompactPlayChrome } from "./play-chrome";

describe("play chrome", () => {
  it("exposes the World 1 touch pad keys", () => {
    expect(PLAY_TOUCH_KEYS.map((key) => key.letter)).toEqual(["A", "C", "P", "W"]);
    expect(PLAY_TOUCH_KEYS.map((key) => key.label)).toEqual([
      "Assist",
      "Chat",
      "Push",
      "Wallet",
    ]);
  });

  it("exposes a footer menu that can open the debug panel", () => {
    expect(PLAY_FOOTER_MENU.map((item) => item.id)).toEqual(["debug"]);
    expect(PLAY_FOOTER_MENU.map((item) => item.label)).toEqual(["Debug panel"]);
  });

  it("treats a narrow viewport as compact play chrome", () => {
    expect(COMPACT_PLAY_CHROME_QUERY).toContain("860px");
    expect(isCompactPlayChrome({ matches: true })).toBe(true);
    expect(isCompactPlayChrome({ matches: false })).toBe(false);
    expect(isCompactPlayChrome(null)).toBe(false);
  });
});

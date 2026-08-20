import { describe, expect, it } from "vitest";
import { PLAY_FOOTER_MENU, PLAY_TOUCH_KEYS } from "./play-chrome";

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
});

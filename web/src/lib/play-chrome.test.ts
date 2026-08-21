import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COMPACT_PLAY_CHROME_QUERY,
  HUD_DOCK_WIDE_QUERY,
  PLAY_PANEL_IDS,
  PLAY_TOUCH_KEYS,
  SESSION_PANEL_MAX_WIDTH_PX,
  isCompactPlayChrome,
  isWideHudDock,
} from "./play-chrome";

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

  it("names the three floating preview panels", () => {
    expect(PLAY_PANEL_IDS).toEqual(["messages", "session", "debug"]);
  });

  it("treats a narrow viewport as compact play chrome", () => {
    expect(COMPACT_PLAY_CHROME_QUERY).toContain("860px");
    expect(isCompactPlayChrome({ matches: true })).toBe(true);
    expect(isCompactPlayChrome({ matches: false })).toBe(false);
    expect(isCompactPlayChrome(null)).toBe(false);
  });

  it("places the Games G pill and wallet chip top-right on a wide dock", () => {
    expect(HUD_DOCK_WIDE_QUERY).toContain("1024px");
    expect(isWideHudDock({ matches: true })).toBe(true);
    expect(isWideHudDock({ matches: false })).toBe(false);
    expect(isWideHudDock(null)).toBe(false);
  });

  it("opens the human agent panel at the widest allowed folio", () => {
    expect(SESSION_PANEL_MAX_WIDTH_PX).toBe(640);
  });

  it("lets chat, session, and debug bodies fill extra panel height", () => {
    const world2Css = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "../world2.css"),
      "utf8"
    );
    const booth = world2Css.match(/\.play-chat-booth \{[\s\S]*?\n\}/);
    const tape = world2Css.match(/\.play-chat-tape \{[\s\S]*?\n\}/);
    const session = world2Css.match(/\.play-session-booth \{[\s\S]*?\n\}/);
    const passport = world2Css.match(/\.play-passport \{[\s\S]*?\n\}/);
    const debug = world2Css.match(/\.play-debug-radar \{[\s\S]*?\n\}/);
    const tabpanel = world2Css.match(/\.play-debug-tabpanel \{[\s\S]*?\n\}/);
    const debugPanel = world2Css.match(/\.play-panel-debug \{[\s\S]*?\n\}/);
    const tray = world2Css.match(/\.play-notification-tray \{[\s\S]*?\n\}/);
    expect(booth?.[0]).toMatch(/flex-direction:\s*column/);
    expect(tape?.[0]).toMatch(/flex:\s*1 1 auto/);
    expect(tape?.[0]).not.toMatch(/max-height:\s*220px/);
    expect(session?.[0]).toMatch(/flex-direction:\s*column/);
    expect(passport?.[0]).toMatch(/flex:\s*1 1 auto/);
    expect(debug?.[0]).toMatch(/flex-direction:\s*column/);
    expect(tabpanel?.[0]).toMatch(/flex:\s*1 1 auto/);
    expect(debugPanel?.[0]).not.toMatch(/max-height:\s*min\(46vh/);
    expect(tray?.[0]).toMatch(/right:/);
    expect(tray?.[0]).toMatch(/bottom:/);
    expect(tray?.[0]).not.toMatch(/left:\s*50%/);
    expect(tray?.[0]).not.toMatch(/transform:\s*translateX\(-50%\)/);
  });
});

import { describe, expect, it } from "vitest";
import { GAME_SITE_HREF } from "./origins";
import { NAV_GROUPS } from "./navigation";

describe("professional navigation", () => {
  it("uses Play, Launch, Citizens, and Engineering as top-level names", () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      "Play",
      "Launch",
      "Citizens",
      "Engineering",
    ]);
  });

  it("nests live world and opening reel under Play", () => {
    const play = NAV_GROUPS.find((group) => group.id === "play");
    expect(play?.items).toEqual(
      expect.arrayContaining([
        { label: "Live world", href: GAME_SITE_HREF, external: true },
        { label: "Opening reel", href: "/" },
      ])
    );
  });

  it("nests studio catalog, avatar set, and inks under Citizens", () => {
    const citizens = NAV_GROUPS.find((group) => group.id === "citizens");
    const labels = citizens?.items.map((item) => item.label);
    expect(labels).toEqual(["Studio catalog", "Avatar set", "Inks"]);
  });

  it("nests WebGL, Rust, Native C, and Visage under Engineering", () => {
    const engineering = NAV_GROUPS.find((group) => group.id === "engineering");
    const labels = engineering?.items.map((item) => item.label);
    expect(labels).toEqual([
      "Overview",
      "WebGL",
      "Rust",
      "Native C",
      "Visage",
    ]);
  });
});

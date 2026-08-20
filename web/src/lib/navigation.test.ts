import { describe, expect, it } from "vitest";
import { ECONEXT_HREF } from "./origins";
import { NAV_LINKS } from "./navigation";

describe("site navigation", () => {
  it("keeps Play and Banking as the only top-level links", () => {
    expect(NAV_LINKS.map((link) => link.label)).toEqual(["Play", "Banking"]);
  });

  it("sends Play to the game shell and Banking to Econext", () => {
    expect(NAV_LINKS).toEqual([
      { id: "play", label: "Play", href: "/game-shell" },
      {
        id: "banking",
        label: "Banking",
        href: ECONEXT_HREF,
        external: true,
      },
    ]);
  });
});

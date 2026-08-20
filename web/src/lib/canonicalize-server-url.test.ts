import { describe, expect, it } from "vitest";
import { canonicalizeOccupancyServerUrl } from "./canonicalize-server-url";

describe("occupancy serverUrl canonicalization", () => {
  it("keeps agent-play.com", () => {
    const result = canonicalizeOccupancyServerUrl("https://agent-play.com");
    expect(result).toEqual({
      ok: true,
      serverUrl: "https://agent-play.com",
    });
  });

  it("canonicalizes occupancy aliases to agent-play.com", () => {
    const aliases = [
      "https://www.agent-play.com",
      "https://playworld.world/",
      "https://world1.v0peer.org",
    ];

    for (const alias of aliases) {
      const result = canonicalizeOccupancyServerUrl(alias);
      expect(result).toEqual({
        ok: true,
        serverUrl: "https://agent-play.com",
      });
    }
  });

  it("rejects world2 and worldN page origins as serverUrl", () => {
    const rejected = [
      "https://world2.v0peer.org",
      "https://world3.v0peer.org",
      "https://world9.v0peer.org/",
    ];

    for (const url of rejected) {
      const result = canonicalizeOccupancyServerUrl(url);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/page origin/i);
      }
    }
  });
});

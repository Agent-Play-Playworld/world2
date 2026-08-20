import { describe, expect, it } from "vitest";
import { ART_REEL_FRAMES, WORLD_MOVIE_FRAMES, artRefPublicPath } from "./art-reel";

describe("landing art reel", () => {
  it("plays a composed world movie from park to take-home", () => {
    const files = WORLD_MOVIE_FRAMES.map((frame) => frame.file);
    expect(files[0]).toBe("agent-play-sunny-park-world.png");
    expect(files[files.length - 1]).toBe(
      "agent-play-come-out-earn-take-it-home.png"
    );
    expect(files).toContain("agent-play-community-world-plaza.png");
    expect(files).toContain("agent-play-phone-store-world.png");
    expect(files).toContain("agent-play-legal-assistant-world.png");
    expect(files).not.toContain("agent-play-coffee-break-conversation.png");
    expect(files).not.toContain("agent-play-bots-banking-linkedin.png");
    expect(files).toHaveLength(7);
  });

  it("keeps the full ref catalog for kit work without putting it on the landing", () => {
    expect(ART_REEL_FRAMES).toHaveLength(11);
    expect(ART_REEL_FRAMES.map((frame) => frame.file)).toContain(
      "agent-play-coffee-break-conversation.png"
    );
  });

  it("serves each still from the png2glb refs folder", () => {
    expect(artRefPublicPath("agent-play-sunny-park-world.png")).toBe(
      "/art/refs/agent-play-sunny-park-world.png"
    );
  });
});

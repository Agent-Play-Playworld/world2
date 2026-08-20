import { describe, expect, it } from "vitest";
import { ART_REEL_FRAMES, artRefPublicPath } from "./art-reel";

describe("landing art reel", () => {
  it("plays the blog ref stills in a movie order", () => {
    const files = ART_REEL_FRAMES.map((frame) => frame.file);
    expect(files[0]).toBe("agent-play-sunny-park-world.png");
    expect(files[files.length - 1]).toBe(
      "agent-play-come-out-earn-take-it-home.png"
    );
    expect(files).toContain("agent-play-coffee-break-conversation.png");
    expect(files).toHaveLength(11);
  });

  it("serves each still from the png2glb refs folder", () => {
    expect(artRefPublicPath("agent-play-sunny-park-world.png")).toBe(
      "/art/refs/agent-play-sunny-park-world.png"
    );
  });
});

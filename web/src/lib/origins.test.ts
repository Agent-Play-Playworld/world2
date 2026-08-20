import { describe, expect, it } from "vitest";
import {
  CANONICAL_OCCUPANCY_ORIGIN,
  GAME_SITE_HREF,
  VISAGE_REPOSITORY_HREF,
  WORLD2_PAGE_ORIGIN,
} from "./origins";

describe("World 2 origins", () => {
  it("keeps occupancy and the 2D game on agent-play.com", () => {
    expect(CANONICAL_OCCUPANCY_ORIGIN).toBe("https://agent-play.com");
    expect(GAME_SITE_HREF).toBe("https://agent-play.com");
  });

  it("treats world2 as a page origin, never occupancy", () => {
    expect(WORLD2_PAGE_ORIGIN).toBe("https://world2.v0peer.org");
    expect(WORLD2_PAGE_ORIGIN).not.toBe(CANONICAL_OCCUPANCY_ORIGIN);
  });

  it("points Visage experience at the Ready Player Me repository", () => {
    expect(VISAGE_REPOSITORY_HREF).toBe(
      "https://github.com/readyplayerme/visage"
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  occupancyApiBase,
  resolveOccupancyOrigin,
} from "./occupancy-origin";

describe("occupancy origin", () => {
  it("uses localhost:3000 during development", () => {
    expect(resolveOccupancyOrigin({ DEV: true })).toBe("http://localhost:3000");
  });

  it("uses agent-play.com in production", () => {
    expect(resolveOccupancyOrigin({ DEV: false })).toBe("https://agent-play.com");
  });

  it("lets VITE_OCCUPANCY_ORIGIN replace the default host", () => {
    expect(
      resolveOccupancyOrigin({
        DEV: true,
        VITE_OCCUPANCY_ORIGIN: "https://staging.agent-play.com/",
      })
    ).toBe("https://staging.agent-play.com");
  });

  it("builds the occupancy API base under /api/agent-play", () => {
    expect(occupancyApiBase("http://localhost:3000")).toBe(
      "http://localhost:3000/api/agent-play"
    );
  });
});

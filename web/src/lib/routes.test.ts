import { describe, expect, it } from "vitest";
import { APP_ROUTES, EXPERIENCE_ROUTES } from "./routes";

describe("World 2 routes", () => {
  it("loads the cinematic landing at the default path", () => {
    const landing = APP_ROUTES.find((route) => route.path === "/");
    expect(landing?.id).toBe("landing");
  });

  it("exposes the store, launch interest, and experience rooms", () => {
    const paths = APP_ROUTES.map((route) => route.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/interest",
        "/assets",
        "/developers",
        "/webgl",
        "/rust",
        "/c",
        "/visage",
      ])
    );
  });

  it("names developer rooms for WebGL, Rust, C, and Visage", () => {
    const ids = EXPERIENCE_ROUTES.map((route) => route.id);
    expect(ids).toEqual(["developers", "webgl", "rust", "c", "visage"]);
  });
});

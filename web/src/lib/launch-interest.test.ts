import { describe, expect, it } from "vitest";
import { getMockLaunchInterest } from "../test-support/factories";
import {
  listLaunchInterest,
  registerLaunchInterest,
} from "./launch-interest";

describe("game launch interest", () => {
  it("records a person who wants to be told when World 2 launches", () => {
    const result = registerLaunchInterest({
      storage: window.localStorage,
      interest: getMockLaunchInterest(),
    });

    expect(result.ok).toBe(true);
    expect(listLaunchInterest({ storage: window.localStorage })).toEqual([
      {
        email: "friend@example.com",
        name: "Ada",
      },
    ]);
  });

  it("accepts interest with only an email", () => {
    const result = registerLaunchInterest({
      storage: window.localStorage,
      interest: { email: "only@example.com" },
    });

    expect(result.ok).toBe(true);
    expect(listLaunchInterest({ storage: window.localStorage })).toEqual([
      { email: "only@example.com" },
    ]);
  });

  it("rejects a missing email", () => {
    const result = registerLaunchInterest({
      storage: window.localStorage,
      interest: { email: "" },
    });

    expect(result.ok).toBe(false);
    expect(listLaunchInterest({ storage: window.localStorage })).toEqual([]);
  });
});

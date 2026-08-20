import { describe, expect, it } from "vitest";
import { getMockCitizenshipCredential } from "../test-support/factories";
import { parseCitizenshipCredential } from "./parse-citizenship";
import {
  findStoreItem,
  purchaseStoreItem,
  STORE_CATALOG,
} from "./store-purchase";

const citizenshipFromFixture = () => {
  const parsed = parseCitizenshipCredential(getMockCitizenshipCredential(), {
    occupancyOrigin: "https://agent-play.com",
  });
  if (!parsed.ok) {
    throw new Error("fixture citizenship must parse");
  }
  return parsed.citizenship;
};

describe("World 2 asset store", () => {
  it("lists an avatar set and ink vials", () => {
    const ids = STORE_CATALOG.map((item) => item.id);
    expect(ids).toContain("avatar-set");
    expect(ids).toContain("ink-low");
    expect(ids).toContain("ink-high");
  });

  it("labels low ink as low life and high ink as high life", () => {
    const low = findStoreItem("ink-low");
    const high = findStoreItem("ink-high");
    expect(low?.kind).toBe("ink");
    expect(high?.kind).toBe("ink");
    if (low?.kind === "ink") {
      expect(low.inkLevel).toBe("low");
      expect(low.life).toBe("low");
    }
    if (high?.kind === "ink") {
      expect(high.inkLevel).toBe("high");
      expect(high.life).toBe("high");
    }
  });

  it("refuses a purchase before citizenship is uploaded", () => {
    const result = purchaseStoreItem({
      itemId: "avatar-set",
      citizenship: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/citizenship/i);
    }
  });

  it("records a purchase after citizenship is uploaded", () => {
    const result = purchaseStoreItem({
      itemId: "ink-high",
      citizenship: citizenshipFromFixture(),
    });

    expect(result).toEqual({
      ok: true,
      order: {
        itemId: "ink-high",
        nodeId: "citizen-node-fixture",
      },
    });
  });

  it("refuses an unknown catalog item even with citizenship", () => {
    const result = purchaseStoreItem({
      itemId: "not-a-sku",
      citizenship: citizenshipFromFixture(),
    });

    expect(result.ok).toBe(false);
  });
});

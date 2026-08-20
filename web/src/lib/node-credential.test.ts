import { describe, expect, it } from "vitest";
import { hashNodePassword, normalizeNodePassphrase } from "./node-credential";

describe("node credential hashing", () => {
  it("normalizes recovery key whitespace before hashing", () => {
    expect(normalizeNodePassphrase("  amber   angle  ")).toBe("amber angle");
  });

  it("hashes the recovery key as lowercase hex SHA-256", async () => {
    const hash = await hashNodePassword("amber angle");
    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    await expect(hashNodePassword(" amber   angle ")).resolves.toBe(hash);
  });
});

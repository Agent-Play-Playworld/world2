import { describe, expect, it } from "vitest";
import {
  PASSPHRASE_WORDS,
  generateNodePassphrase,
  hashNodePassword,
  normalizeNodePassphrase,
} from "./node-credential";

describe("node credential hashing", () => {
  it("normalizes recovery key whitespace before hashing", () => {
    expect(normalizeNodePassphrase("  amber   angle  ")).toBe("amber angle");
  });

  it("hashes the recovery key as lowercase hex SHA-256", async () => {
    const hash = await hashNodePassword("amber angle");
    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    await expect(hashNodePassword(" amber   angle ")).resolves.toBe(hash);
  });

  it("draws recovery keys from a large unique morpheme list so phrases rarely collide", () => {
    expect(new Set(PASSPHRASE_WORDS).size).toBe(PASSPHRASE_WORDS.length);
    expect(PASSPHRASE_WORDS.length).toBeGreaterThan(400);
    const phrase = generateNodePassphrase();
    const words = phrase.split(" ");
    expect(words).toHaveLength(10);
    for (const word of words) {
      expect(PASSPHRASE_WORDS).toContain(word);
    }
  });
});

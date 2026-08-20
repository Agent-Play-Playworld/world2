import { describe, expect, it } from "vitest";
import { getMockCitizenshipCredential } from "../test-support/factories";
import { parseCitizenshipCredential } from "./parse-citizenship";

describe("citizenship credential upload", () => {
  it("accepts a credentials.json citizen file for agent-play.com", () => {
    const file = getMockCitizenshipCredential();
    const result = parseCitizenshipCredential(file);

    expect(result).toEqual({
      ok: true,
      citizenship: {
        nodeId: file.nodeId,
        serverUrl: "https://agent-play.com",
      },
    });
  });

  it("does not keep the passphrase after a successful parse", () => {
    const result = parseCitizenshipCredential(getMockCitizenshipCredential());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.citizenship).not.toHaveProperty("passw");
    }
  });

  it("canonicalizes alias serverUrl values to agent-play.com", () => {
    const result = parseCitizenshipCredential(
      getMockCitizenshipCredential({
        serverUrl: "https://world1.v0peer.org",
      })
    );

    expect(result).toEqual({
      ok: true,
      citizenship: {
        nodeId: "citizen-node-fixture",
        serverUrl: "https://agent-play.com",
      },
    });
  });

  it("rejects a file whose serverUrl is the World 2 page", () => {
    const result = parseCitizenshipCredential(
      getMockCitizenshipCredential({
        serverUrl: "https://world2.v0peer.org",
      })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/page origin/i);
    }
  });

  it("rejects a file that is not credentials.json", () => {
    expect(parseCitizenshipCredential({ hello: "world" }).ok).toBe(false);
    expect(parseCitizenshipCredential(null).ok).toBe(false);
  });
});

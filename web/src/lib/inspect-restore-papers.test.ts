import { describe, expect, it } from "vitest";
import { getMockCitizenshipCredential } from "../test-support/factories";
import {
  inspectRestorePapers,
  pickRestoreFile,
} from "./inspect-restore-papers";

describe("restore citizenship papers", () => {
  it("reads a credentials.json file into a preview without exposing the passphrase", () => {
    const credential = getMockCitizenshipCredential({
      serverUrl: "http://localhost:3000",
      nodeId: "node-derived",
    });
    const result = inspectRestorePapers({
      text: JSON.stringify(credential),
      fileName: "credentials.json",
      occupancyOrigin: "http://localhost:3000",
    });

    expect(result).toEqual({
      ok: true,
      preview: {
        fileName: "credentials.json",
        nodeId: "node-derived",
        serverUrl: "http://localhost:3000",
      },
      passw: credential.passw,
    });
    if (result.ok) {
      expect(result.preview).not.toHaveProperty("passw");
    }
  });

  it("rejects text that is not JSON", () => {
    const result = inspectRestorePapers({
      text: "not json",
      fileName: "credentials.json",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/json/i);
    }
  });

  it("rejects a file that is not credentials.json", () => {
    const result = inspectRestorePapers({
      text: JSON.stringify({ hello: "world" }),
      fileName: "notes.json",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/credentials\.json/i);
    }
  });

  it("prefers a json file when several files are dropped", () => {
    const notes = new File(["nope"], "notes.txt", { type: "text/plain" });
    const papers = new File(["{}"], "credentials.json", {
      type: "application/json",
    });
    expect(pickRestoreFile([notes, papers])?.name).toBe("credentials.json");
    expect(pickRestoreFile([])).toBeNull();
    expect(pickRestoreFile(null)).toBeNull();
  });
});

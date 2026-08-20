import { describe, expect, it, vi } from "vitest";
import {
  createHumanNode,
  createOccupancySession,
  loadOccupancyRootKey,
  loadWorldSnapshot,
  validateMainNode,
} from "./occupancy-client";

const jsonResponse = (body: unknown, ok = true): Response => {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
};

describe("occupancy client", () => {
  it("opens a session from the occupancy host", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("http://localhost:3000/api/agent-play/session");
      return jsonResponse({ sid: "sid-local" });
    });

    await expect(
      createOccupancySession({
        origin: "http://localhost:3000",
        fetchFn,
      })
    ).resolves.toBe("sid-local");
  });

  it("loads world resources with getWorldSnapshot", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ snapshot: { worldMap: { occupants: [] } } })
    );

    const snapshot = await loadWorldSnapshot({
      origin: "https://agent-play.com",
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalled();
    expect(snapshot).toEqual({ worldMap: { occupants: [] } });
  });

  it("creates a human node on the occupancy host", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("sid=sid-local");
      return jsonResponse({ nodeId: "citizen-1" });
    });

    await expect(
      createHumanNode({
        origin: "http://localhost:3000",
        fetchFn,
        sid: "sid-local",
        nodeId: "citizen-1",
        passwHash: "hash",
      })
    ).resolves.toEqual({ nodeId: "citizen-1" });
  });

  it("loads the occupancy root key from bootstrap", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        "http://localhost:3000/api/agent-play/bootstrap"
      );
      return jsonResponse({ rootKey: "AB".repeat(32) });
    });

    await expect(
      loadOccupancyRootKey({
        origin: "http://localhost:3000",
        fetchFn,
      })
    ).resolves.toBe("ab".repeat(32));
  });

  it("validates restored node credentials on the occupancy host", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        "http://localhost:3000/api/agent-play/nodes/validate"
      );
      expect(init?.headers).toMatchObject({
        "x-node-id": "citizen-1",
        "x-node-passw": "hash",
      });
      return jsonResponse({ ok: true, nodeKind: "main" });
    });

    await expect(
      validateMainNode({
        origin: "http://localhost:3000",
        fetchFn,
        nodeId: "citizen-1",
        passwHash: "hash",
      })
    ).resolves.toEqual({ ok: true, nodeKind: "main" });
  });
});

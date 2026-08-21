import { describe, expect, it, vi } from "vitest";
import {
  createHumanNode,
  createOccupancySession,
  fetchGameStats,
  fetchPlayerWallet,
  loadOccupancyRootKey,
  loadWorldChatHistory,
  loadWorldSnapshot,
  publishWorldChat,
  reactWorldChat,
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

describe("occupancy play persistence", () => {
  it("reads the sid-gated player wallet from occupancy", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        "http://localhost:3000/api/agent-play/players/node-derived/wallet?sid=sid-local"
      );
      return jsonResponse({
        wallet: {
          playerId: "node-derived",
          balanceUsd: 12.5,
          powerUps: 25,
          currency: "USD",
          updatedAt: "2026-08-21T12:00:00.000Z",
        },
      });
    });

    await expect(
      fetchPlayerWallet({
        origin: "http://localhost:3000",
        playerId: "node-derived",
        sid: "sid-local",
        fetchFn,
      })
    ).resolves.toEqual({
      playerId: "node-derived",
      balanceUsd: 12.5,
      powerUps: 25,
      currency: "USD",
      updatedAt: "2026-08-21T12:00:00.000Z",
    });
  });

  it("loads arcade stats with getGameStats", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        "http://localhost:3000/api/agent-play/sdk/rpc?sid=sid-local"
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        op: "getGameStats",
        payload: { playerId: "node-derived" },
      });
      return jsonResponse({
        stats: {
          dayStreak: 3,
          bestStreak: 7,
          puEarnedToday: 12,
          puCapRemaining: 88,
          gamesPlayedToday: 2,
          featuredGameId: "hidden-gems",
          firstGamePlayed: false,
          perGame: { "hidden-gems": { plays: 2, bestNetPu: 8 } },
        },
      });
    });

    const result = await fetchGameStats({
      origin: "http://localhost:3000",
      playerId: "node-derived",
      sid: "sid-local",
      fetchFn,
    });
    expect(result.dayStreak).toBe(3);
    expect(result.featuredGameId).toBe("hidden-gems");
    expect(result.puCapRemaining).toBe(88);
  });

  it("loads persisted world chat history", async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        op: "worldChatHistory",
        payload: { limit: 100 },
      });
      return jsonResponse({
        messages: [
          {
            seq: 4,
            requestId: "msg-4",
            fromPlayerId: "maple",
            message: "hello street",
            ts: "2026-08-21T12:00:00.000Z",
            depth: 0,
            reactions: { love: [], thumbs_up: ["bob"] },
          },
        ],
        hasMore: false,
        totalCount: 1,
      });
    });

    const history = await loadWorldChatHistory({
      origin: "http://localhost:3000",
      sid: "sid-local",
      fetchFn,
    });
    expect(history.messages[0]?.message).toBe("hello street");
    expect(history.totalCount).toBe(1);
  });

  it("publishes a world chat line to occupancy", async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        op: "worldChatPublish",
        payload: {
          requestId: "msg-new",
          mainNodeId: "node-derived",
          fromPlayerId: "node-derived",
          message: "hello street",
        },
      });
      return jsonResponse({ ok: true });
    });

    await expect(
      publishWorldChat({
        origin: "http://localhost:3000",
        sid: "sid-local",
        fetchFn,
        requestId: "msg-new",
        mainNodeId: "node-derived",
        fromPlayerId: "node-derived",
        message: "hello street",
      })
    ).resolves.toBeUndefined();
  });

  it("persists a world chat reaction on occupancy", async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        op: "worldChatReact",
        payload: {
          requestId: "msg-4",
          mainNodeId: "node-derived",
          fromPlayerId: "node-derived",
          kind: "love",
          action: "set",
        },
      });
      return jsonResponse({
        ok: true,
        reactions: { love: ["node-derived"], thumbs_up: [] },
      });
    });

    await expect(
      reactWorldChat({
        origin: "http://localhost:3000",
        sid: "sid-local",
        fetchFn,
        requestId: "msg-4",
        mainNodeId: "node-derived",
        fromPlayerId: "node-derived",
        kind: "love",
        action: "set",
      })
    ).resolves.toEqual({ love: ["node-derived"], thumbs_up: [] });
  });
});

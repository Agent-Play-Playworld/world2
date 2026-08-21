import { describe, expect, it } from "vitest";
import {
  appendWorldChatLine,
  buildWorldChatLink,
  canReplyToWorldChatDepth,
  clampPanelPlacement,
  clampPanelSize,
  COLLAPSED_PANEL_HEIGHT_PX,
  nextExpandedPanelHeightPx,
  shouldReleaseExpandedPanelHeight,
  defaultGameStreakPreview,
  defaultInvitePreview,
  defaultInstalledContentPacks,
  defaultPlayDebugSettings,
  defaultWalletPreview,
  formatApuCount,
  formatApwBalance,
  formatCompactCount,
  formatDebugSwitch,
  formatGeographyMembers,
  gameStreakFromOccupancyStats,
  insertChatGlyph,
  installChatContentPack,
  intercomAddressForNode,
  isImageWalletAsset,
  isValidIntercomAddress,
  listeningNamesFromSnapshot,
  loadPlayDebugSettings,
  parsePlayDebugSnapshot,
  powerUpsToNextBundle,
  reactToWorldChatLine,
  savePlayDebugSettings,
  setPlayDebugSetting,
  walletPreviewFromOccupancy,
  worldChatLinesFromHistory,
  WORLD_CHAT_EMPTY_HEADLINE,
  WORLD_CHAT_FLAP_WORDS,
  WORLD_CHAT_SELF_NAME,
  PLAZA_STICKER_PACK,
  STREET_STICKER_PACK,
} from "./play-preview";

describe("play preview data", () => {
  it("formats APW$ and APU the way the wallet chip prints them", () => {
    expect(formatApwBalance(12.5)).toBe("$12.50");
    expect(formatApuCount(25)).toBe("25");
    expect(defaultWalletPreview()).toEqual(
      expect.objectContaining({ balanceUsd: 0, powerUps: 0 })
    );
  });

  it("builds an intercom address from the citizen node", () => {
    expect(intercomAddressForNode("node-derived")).toBe(
      "ap-intercom://node-derived"
    );
    expect(isValidIntercomAddress("ap-intercom://node-derived")).toBe(true);
    expect(isValidIntercomAddress("https://agent-play.com")).toBe(false);
  });

  it("previews arcade streak copy with a 100 APU daily cap", () => {
    expect(defaultGameStreakPreview().puCap).toBe(100);
    expect(defaultGameStreakPreview().featuredGameId).toBe("daily-rotator");
    expect(powerUpsToNextBundle(3)).toBe(7);
    expect(powerUpsToNextBundle(10)).toBeNull();
  });

  it("reads agents and structures from a world snapshot for the debug panel", () => {
    expect(
      parsePlayDebugSnapshot({
        worldMap: {
          occupants: [
            { kind: "agent", agentId: "ag-1", name: "Maple bot", x: 1.2, y: 3.4 },
            { kind: "structure", id: "st-1", name: "Mall", x: 8, y: 2, spaceIds: ["s1"] },
            { kind: "structure", id: "st-2", name: "Cabinet", x: 9, y: 2, gameId: "hidden-gems" },
            { kind: "human", id: "__human__", name: "You", x: 0, y: 0 },
          ],
        },
      })
    ).toEqual({
      agents: [{ playerId: "ag-1", name: "Maple bot", worldX: 1.2, worldY: 3.4 }],
      structures: [
        { id: "st-1", kind: "space", x: 8, y: 2 },
        { id: "st-2", kind: "arcade", x: 9, y: 2 },
      ],
      memberCount: 2,
    });
  });

  it("keeps dragged panels inside the shell", () => {
    expect(
      clampPanelPlacement({
        leftPx: 900,
        topPx: -40,
        panelWidth: 320,
        panelHeight: 200,
        boundsWidth: 800,
        boundsHeight: 600,
      })
    ).toEqual({ leftPx: 480, topPx: 0 });
    expect(
      clampPanelPlacement({
        leftPx: Number.NaN,
        topPx: Number.NaN,
        panelWidth: 320,
        panelHeight: 200,
        boundsWidth: 800,
        boundsHeight: 600,
      })
    ).toEqual({ leftPx: 0, topPx: 0 });
  });

  it("previews a referral code from the node id", () => {
    expect(defaultInvitePreview("node-derived").code).toBe("NODE-DER");
    expect(defaultInvitePreview("node-derived").link).toContain("rc=NODE-DER");
    expect(defaultInvitePreview("node-derived").rewardApu).toBe("+25 APU");
  });

  it("prints a compact world-chat count and names who is listening", () => {
    expect(formatCompactCount(0)).toBe("0");
    expect(formatCompactCount(12)).toBe("12");
    expect(formatCompactCount(1500)).toBe("1.5K");
    expect(WORLD_CHAT_EMPTY_HEADLINE).toMatch(/street/i);
    expect([...WORLD_CHAT_FLAP_WORDS]).toEqual([
      "THE",
      "STREET",
      "IS",
      "LISTENING",
    ]);
    expect(
      listeningNamesFromSnapshot({
        worldMap: {
          occupants: [
            { kind: "agent", agentId: "ag-1", name: "Maple bot", x: 1, y: 1 },
          ],
        },
      })
    ).toEqual(["Maple bot"]);
    expect(
      appendWorldChatLine({
        lines: [],
        message: "  hello street  ",
        now: new Date("2026-08-21T00:00:00.000Z"),
      }).map((line) => line.message)
    ).toEqual(["hello street"]);
  });

  it("loves, likes, replies, and copies a world chat deep link", () => {
    const [root] = appendWorldChatLine({
      lines: [],
      message: "hello street",
      now: new Date("2026-08-21T00:00:00.000Z"),
    });
    if (root === undefined) {
      throw new Error("expected a root line");
    }
    const loved = reactToWorldChatLine({
      lines: [root],
      requestId: root.requestId,
      playerId: WORLD_CHAT_SELF_NAME,
      kind: "love",
    });
    expect(loved[0]?.reactions.love).toEqual([WORLD_CHAT_SELF_NAME]);
    const cancelled = reactToWorldChatLine({
      lines: loved,
      requestId: root.requestId,
      playerId: WORLD_CHAT_SELF_NAME,
      kind: "love",
    });
    expect(cancelled[0]?.reactions.love).toEqual([]);
    expect(canReplyToWorldChatDepth(0)).toBe(true);
    expect(canReplyToWorldChatDepth(2)).toBe(false);
    const withReply = appendWorldChatLine({
      lines: [root],
      message: "same here",
      parent: root,
      now: new Date("2026-08-21T00:01:00.000Z"),
    });
    expect(withReply[1]?.parentRequestId).toBe(root.requestId);
    expect(withReply[1]?.depth).toBe(1);
    expect(
      new URL(
        buildWorldChatLink({
          requestId: root.requestId,
          baseUrl: "https://world2.v0peer.org/",
        })
      ).searchParams.get("message")
    ).toBe(root.requestId);
  });

  it("stocks the wallet cabinet with image and pdf previews", () => {
    const wallet = defaultWalletPreview();
    expect(wallet.assets.map((asset) => asset.kind)).toEqual([
      "png",
      "jpg",
      "gif",
      "webp",
      "pdf",
    ]);
    expect(wallet.assets.filter(isImageWalletAsset)).toHaveLength(4);
    expect(wallet.assets.some((asset) => asset.kind === "pdf")).toBe(true);
  });

  it("clamps a dragged panel resize", () => {
    expect(
      clampPanelSize({
        widthPx: 90,
        heightPx: 900,
        minWidthPx: 280,
        minHeightPx: 220,
        maxWidthPx: 560,
        maxHeightPx: 640,
      })
    ).toEqual({ widthPx: 280, heightPx: 640 });
  });

  it("eases expand height to the live open layout, including added fold space", () => {
    expect(
      nextExpandedPanelHeightPx({
        measuredOpenPx: 320,
        storedOpenPx: 220,
        collapsedPx: COLLAPSED_PANEL_HEIGHT_PX,
      })
    ).toBe(320);
    expect(
      nextExpandedPanelHeightPx({
        measuredOpenPx: 0,
        storedOpenPx: 220,
        collapsedPx: COLLAPSED_PANEL_HEIGHT_PX,
      })
    ).toBe(220);
    expect(
      nextExpandedPanelHeightPx({
        measuredOpenPx: 180,
        storedOpenPx: 400,
        collapsedPx: COLLAPSED_PANEL_HEIGHT_PX,
        userSized: true,
      })
    ).toBe(400);
    expect(
      shouldReleaseExpandedPanelHeight({ userSized: false })
    ).toBe(true);
    expect(
      shouldReleaseExpandedPanelHeight({ userSized: true })
    ).toBe(false);
  });

  it("prints geography membership as members n/100", () => {
    expect(formatGeographyMembers(1)).toBe("members 1/100");
    expect(formatGeographyMembers(0)).toBe("members 0/100");
  });

  it("treats debug toggles as pause-menu settings", () => {
    const off = defaultPlayDebugSettings();
    expect(formatDebugSwitch(off.worldGeographyEnabled)).toBe("Off");
    expect(off.p2aEnabled).toBe(true);
    const on = setPlayDebugSetting({
      settings: off,
      key: "worldGeographyEnabled",
      enabled: true,
    });
    expect(on.worldGeographyEnabled).toBe(true);
    expect(formatDebugSwitch(on.worldGeographyEnabled)).toBe("On");
    expect(
      setPlayDebugSetting({
        settings: on,
        key: "showLayoutZones",
        enabled: true,
      }).showLayoutZones
    ).toBe(true);
    expect(
      setPlayDebugSetting({
        settings: off,
        key: "p2aEnabled",
        enabled: false,
      }).p2aEnabled
    ).toBe(true);
  });

  it("installs a plaza sticker pack and inserts a glyph into a draft", () => {
    const installed = defaultInstalledContentPacks();
    expect(installed.map((pack) => pack.id)).toEqual([STREET_STICKER_PACK.id]);
    expect(STREET_STICKER_PACK.glyphs).toHaveLength(50);
    const withPlaza = installChatContentPack({
      installed,
      pack: PLAZA_STICKER_PACK,
    });
    expect(withPlaza.map((pack) => pack.id)).toEqual([
      STREET_STICKER_PACK.id,
      PLAZA_STICKER_PACK.id,
    ]);
    expect(
      installChatContentPack({
        installed: withPlaza,
        pack: PLAZA_STICKER_PACK,
      })
    ).toHaveLength(2);
    expect(insertChatGlyph({ draft: "hello", glyph: "🌟" })).toBe("hello🌟");
    expect(
      appendWorldChatLine({
        lines: [],
        message: insertChatGlyph({ draft: "", glyph: "🌟" }),
      })[0]?.message
    ).toBe("🌟");
  });

  it("maps occupancy wallet, arcade stats, and chat history into play preview", () => {
    expect(
      walletPreviewFromOccupancy({
        playerId: "node-derived",
        balanceUsd: 12.5,
        powerUps: 25,
        currency: "USD",
        updatedAt: "2026-08-21T12:00:00.000Z",
      })
    ).toEqual(
      expect.objectContaining({
        balanceUsd: 12.5,
        powerUps: 25,
      })
    );
    expect(
      gameStreakFromOccupancyStats({
        dayStreak: 3,
        bestStreak: 7,
        puEarnedToday: 12,
        puCapRemaining: 88,
        gamesPlayedToday: 2,
        featuredGameId: "hidden-gems",
        firstGamePlayed: false,
        perGame: { "hidden-gems": { plays: 2, bestNetPu: 8 } },
      })
    ).toEqual({
      dayStreak: 3,
      bestStreak: 7,
      puEarnedToday: 12,
      puCap: 100,
      gamesPlayedToday: 2,
      featuredGameId: "hidden-gems",
    });
    const lines = worldChatLinesFromHistory({
      viewerId: "node-derived",
      messages: [
        {
          seq: 2,
          requestId: "msg-2",
          fromPlayerId: "node-derived",
          message: "my line",
          ts: "2026-08-21T12:01:00.000Z",
          depth: 0,
        },
        {
          seq: 1,
          requestId: "msg-1",
          fromPlayerId: "maple",
          message: "hello street",
          ts: "2026-08-21T12:00:00.000Z",
          depth: 0,
          reactions: { love: [], thumbs_up: ["bob"] },
        },
      ],
    });
    expect(lines.map((line) => line.requestId)).toEqual(["msg-1", "msg-2"]);
    expect(lines[0]?.fromSelf).toBe(false);
    expect(lines[1]?.fromSelf).toBe(true);
    expect(lines[1]?.senderName).toBe(WORLD_CHAT_SELF_NAME);
  });

  it("remembers pause-menu debug options for the citizen node", () => {
    const storage = window.localStorage;
    const enabled = setPlayDebugSetting({
      settings: defaultPlayDebugSettings(),
      key: "worldGeographyEnabled",
      enabled: true,
    });
    savePlayDebugSettings({
      settings: enabled,
      storage,
      nodeId: "node-derived",
    });
    expect(
      loadPlayDebugSettings({ storage, nodeId: "node-derived" }).worldGeographyEnabled
    ).toBe(true);
    expect(
      loadPlayDebugSettings({ storage, nodeId: "other-node" }).worldGeographyEnabled
    ).toBe(false);
    const migrated = loadPlayDebugSettings({
      storage: {
        getItem: () =>
          JSON.stringify({
            worldGeographyEnabled: true,
            showLayoutZones: false,
            showFreeGrids: false,
          }),
      },
    });
    expect(migrated.worldGeographyEnabled).toBe(true);
    expect(migrated.p2aEnabled).toBe(true);
    expect(
      loadPlayDebugSettings({
        storage: {
          getItem: () =>
            JSON.stringify({
              worldGeographyEnabled: false,
              showLayoutZones: false,
              showFreeGrids: false,
              p2aEnabled: false,
            }),
        },
      }).p2aEnabled
    ).toBe(true);
  });
});

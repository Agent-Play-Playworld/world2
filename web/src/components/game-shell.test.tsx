import type { ReactElement } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GameShell } from "./game-shell";
import { SESSION_PANEL_MAX_WIDTH_PX } from "../lib/play-chrome";
import type { OccupancyEventSource } from "../lib/occupancy-events";
import { WORLD_INTERCOM_SSE, WORLD_PLAYER_ADDED_SSE } from "../schemas/occupancy-play";
import { TEN_WORD_PASSPHRASE } from "../test-support/factories";
import { buildMessageLikeNotification } from "../lib/world-notification";

const renderShell = (ui: ReactElement): void => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {ui}
    </MemoryRouter>
  );
};

const snapshotWithStreet = {
  worldMap: {
    occupants: [
      { kind: "agent", agentId: "ag-1", name: "Maple bot", x: 1.2, y: 3.4 },
      { kind: "structure", id: "st-1", name: "Mall", x: 8, y: 2, spaceIds: ["s1"] },
    ],
  },
};

const jsonResponse = (body: unknown, ok = true): Response => {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
};

const occupancyWallet = {
  playerId: "node-derived",
  balanceUsd: 12.5,
  powerUps: 25,
  currency: "USD" as const,
  updatedAt: "2026-08-21T12:00:00.000Z",
};

const occupancyStats = {
  dayStreak: 3,
  bestStreak: 7,
  puEarnedToday: 12,
  puCapRemaining: 88,
  gamesPlayedToday: 2,
  featuredGameId: "hidden-gems",
  firstGamePlayed: false,
  perGame: { "hidden-gems": { plays: 2, bestNetPu: 8 } },
};

const occupancyHistory = {
  messages: [
    {
      seq: 1,
      requestId: "msg-1",
      fromPlayerId: "maple",
      message: "hello street",
      ts: "2026-08-21T12:00:00.000Z",
      depth: 0 as const,
      reactions: { love: [], thumbs_up: [] },
    },
  ],
  hasMore: false,
  totalCount: 1,
};

const createOccupancyPlayFetch = () => {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/players/") && url.includes("/wallet")) {
      return jsonResponse({ wallet: occupancyWallet });
    }
    const body: unknown =
      init?.body === undefined ? {} : JSON.parse(String(init.body));
    const op =
      typeof body === "object" && body !== null && "op" in body ? body.op : undefined;
    if (op === "getGameStats") {
      return jsonResponse({ stats: occupancyStats });
    }
    if (op === "worldChatHistory") {
      return jsonResponse(occupancyHistory);
    }
    if (op === "worldChatPublish") {
      return jsonResponse({ ok: true });
    }
    if (op === "worldChatReact") {
      return jsonResponse({
        ok: true,
        reactions: { love: ["node-derived"], thumbs_up: [] },
      });
    }
    return jsonResponse({ error: "unknown" }, false);
  });
};

const rpcOps = (fetchFn: ReturnType<typeof createOccupancyPlayFetch>): unknown[] => {
  return fetchFn.mock.calls.map(([, init]) => {
    if (init?.body === undefined) {
      return undefined;
    }
    const body: unknown = JSON.parse(String(init.body));
    if (typeof body === "object" && body !== null && "op" in body) {
      return body.op;
    }
    return undefined;
  });
};

type MockEventSource = OccupancyEventSource & {
  url: string;
  listeners: Map<string, Array<(event: MessageEvent<string>) => void>>;
  emit: (type: string, data: unknown) => void;
};

const createMockEventSource = (): MockEventSource => {
  const listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  const source: MockEventSource = {
    url: "",
    listeners,
    addEventListener: (type, listener) => {
      const current = listeners.get(type) ?? [];
      listeners.set(type, [...current, listener]);
    },
    close: () => undefined,
    emit: (type, data) => {
      const event = { data: JSON.stringify(data) } as MessageEvent<string>;
      for (const listener of listeners.get(type) ?? []) {
        listener(event);
      }
    },
  };
  return source;
};

const createSilentEventSource = (): OccupancyEventSource => {
  return createMockEventSource();
};

describe("Game shell", () => {
  it("hosts a blank white world canvas with World 1 play chrome", () => {
    renderShell(<GameShell />);
    const shell = screen.getByRole("region", { name: /game shell/i });
    expect(within(shell).getByRole("img", { name: /world canvas/i })).toBeInTheDocument();
    expect(
      within(shell).queryByRole("region", { name: /world movie/i })
    ).not.toBeInTheDocument();
    expect(within(shell).getByRole("region", { name: /world chat room/i })).toBeInTheDocument();
    expect(
      within(shell).getByRole("region", { name: /human agent interaction/i })
    ).toBeInTheDocument();
    expect(
      within(shell).getByRole("complementary", { name: /game settings/i })
    ).toBeInTheDocument();
    expect(within(shell).getByRole("group", { name: /play pad/i })).toHaveClass(
      "play-pad-center"
    );
    expect(within(shell).getByRole("group", { name: /touch pad/i })).toHaveClass(
      "play-touch-pad-bar",
      "play-touch-pad-top"
    );
    expect(within(shell).getByRole("button", { name: /^assist$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^chat$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^push$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^wallet$/i })).toBeInTheDocument();
    expect(
      within(shell).queryByRole("group", { name: /playback/i })
    ).not.toBeInTheDocument();
    expect(
      within(shell).queryByRole("toolbar", { name: /play menu/i })
    ).not.toBeInTheDocument();
    expect(shell.querySelector(".play-chrome-hands")).not.toBeNull();
    expect(shell.querySelector(".play-chrome-top")).not.toBeNull();
  });

  it("shows P2A options and an intercom address on the messages panel", async () => {
    const user = userEvent.setup();
    renderShell(<GameShell nodeId="node-derived" />);
    const messages = screen.getByRole("region", { name: /world chat room/i });
    expect(within(messages).getByText(/the street is holding its breath/i)).toBeInTheDocument();
    expect(within(messages).getByRole("button", { name: /^reply$/i })).toBeInTheDocument();
    expect(within(messages).getByRole("button", { name: /^copy link$/i })).toBeInTheDocument();
    expect(within(messages).getByRole("button", { name: /^love$/i })).toBeInTheDocument();
    expect(within(messages).getByRole("button", { name: /^like$/i })).toBeInTheDocument();
    expect(
      within(messages).getByPlaceholderText(/say something to everyone/i)
    ).toBeEnabled();
    await user.click(within(messages).getByRole("checkbox", { name: /p2a/i }));
    expect(
      within(messages).getByText(/share this intercom-address/i)
    ).toBeInTheDocument();
    expect(within(messages).getByDisplayValue("ap-intercom://node-derived")).toBeInTheDocument();
    expect(within(messages).getByRole("button", { name: /^copy$/i })).toBeEnabled();
    expect(within(messages).getByRole("link", { name: /p2a help/i })).toHaveAttribute(
      "href",
      expect.stringContaining("p2a")
    );
  });

  it("lets a citizen print a line onto the world chat tape", async () => {
    const user = userEvent.setup();
    renderShell(
      <GameShell
        nodeId="node-derived"
        snapshot={{
          worldMap: {
            occupants: [
              { kind: "agent", agentId: "ag-1", name: "Maple bot", x: 1.2, y: 3.4 },
            ],
          },
        }}
      />
    );
    const messages = screen.getByRole("region", { name: /world chat room/i });
    expect(within(messages).getByText(/maple bot is on the tape/i)).toBeInTheDocument();
    expect(messages.querySelector(".play-chat-booth")).not.toBeNull();
    await user.type(
      within(messages).getByPlaceholderText(/say something to everyone/i),
      "hello street"
    );
    await user.click(within(messages).getByRole("button", { name: /^send$/i }));
    expect(within(messages).getByText("hello street")).toBeInTheDocument();
    expect(within(messages).getByLabelText(/2 world messages/i)).toBeInTheDocument();
    const hello = within(messages).getByText("hello street").closest("li");
    expect(hello).not.toBeNull();
    expect(hello).toHaveClass("is-self");
    expect(within(hello as HTMLElement).getByRole("button", { name: /^reply$/i })).toBeInTheDocument();
    expect(within(hello as HTMLElement).getByRole("button", { name: /^copy link$/i })).toBeInTheDocument();
    expect(within(hello as HTMLElement).getByRole("button", { name: /^love$/i })).toBeInTheDocument();
    expect(within(hello as HTMLElement).getByRole("button", { name: /^like$/i })).toBeInTheDocument();
  });

  it("loves, likes, replies, and copies a world chat link from a tape line", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderShell(<GameShell nodeId="node-derived" />);
    const messages = screen.getByRole("region", { name: /world chat room/i });
    await user.type(
      within(messages).getByPlaceholderText(/say something to everyone/i),
      "hello street"
    );
    await user.click(within(messages).getByRole("button", { name: /^send$/i }));
    const hello = within(messages).getByText("hello street").closest("li");
    expect(hello).not.toBeNull();
    const strip = hello as HTMLElement;
    await user.click(within(strip).getByRole("button", { name: /^love$/i }));
    expect(within(strip).getByRole("button", { name: /^love 1$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(within(strip).getByRole("button", { name: /^like$/i }));
    expect(within(strip).getByRole("button", { name: /^like 1$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(strip).getByRole("button", { name: /^love$/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await user.click(within(strip).getByRole("button", { name: /^reply$/i }));
    expect(within(messages).getByText(/replying to you/i)).toBeInTheDocument();
    await user.type(
      within(messages).getByPlaceholderText(/say something to everyone/i),
      "same here"
    );
    await user.click(within(messages).getByRole("button", { name: /^send$/i }));
    expect(within(messages).getByText("same here")).toBeInTheDocument();
    expect(within(messages).getByText(/replying to you: hello street/i)).toBeInTheDocument();
    await user.click(within(messages).getAllByRole("button", { name: /^copy link$/i })[0]!);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls[0]?.[0])).toContain("message=");
  });

  it("posts a sticker from the street pack and installs plaza stickers", async () => {
    const user = userEvent.setup();
    renderShell(<GameShell nodeId="node-derived" />);
    const messages = screen.getByRole("region", { name: /world chat room/i });
    await user.click(within(messages).getByRole("button", { name: /content pack/i }));
    expect(within(messages).getByLabelText(/installed content packs/i)).toBeInTheDocument();
    await user.click(within(messages).getByRole("button", { name: /insert 😀/i }));
    await user.click(within(messages).getByRole("button", { name: /^send$/i }));
    const tape = within(messages).getByLabelText(/world chat tape/i);
    expect(within(tape).getByText("😀")).toBeInTheDocument();
    expect(within(tape).getByText("😀").closest("li")).toHaveClass("is-self");
    await user.click(within(messages).getByRole("button", { name: /install plaza stickers/i }));
    expect(within(messages).getByRole("button", { name: /insert 🌟/i })).toBeInTheDocument();
  });

  it("shows node information with download and create-new-node options", async () => {
    const user = userEvent.setup();
    const onCreateNewNode = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:credentials");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        nodeId="node-derived"
        passw={TEN_WORD_PASSPHRASE}
        onCreateNewNode={onCreateNewNode}
      />
    );
    const session = screen.getByRole("region", { name: /human agent interaction/i });
    expect(session.querySelector(".play-session-booth")).not.toBeNull();
    expect(session).toHaveStyle({
      width: `min(${String(SESSION_PANEL_MAX_WIDTH_PX)}px, calc(100vw - 24px))`,
    });
    expect(within(session).getByText(/world 2 citizen folio/i)).toBeInTheDocument();
    expect(within(session).getByText(/node information/i)).toBeInTheDocument();
    expect(within(session).getByText("node-derived")).toBeInTheDocument();
    expect(within(session).getByRole("button", { name: /assist action/i })).toBeDisabled();
    expect(within(session).getByRole("button", { name: /chat action/i })).toBeDisabled();
    expect(within(session).getByRole("button", { name: /push to talk/i })).toBeDisabled();
    await user.click(within(session).getByRole("button", { name: /download credentials/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    await user.click(within(session).getByRole("button", { name: /create new node/i }));
    expect(
      screen.getByRole("dialog", { name: /create a new main node/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /yes, replace node/i }));
    expect(onCreateNewNode).toHaveBeenCalled();
  });

  it("previews occupancy debug rows from the live snapshot", () => {
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        sid="sid-local"
        snapshot={snapshotWithStreet}
      />
    );
    const debug = screen.getByRole("complementary", { name: /game settings/i });
    expect(debug.querySelector(".play-debug-cabinet")).not.toBeNull();
    expect(debug.querySelector(".play-radar-scope")).toBeNull();
    expect(within(debug).getByRole("tablist", { name: /game settings/i })).toBeInTheDocument();
    expect(within(debug).getByRole("switch", { name: /world geography/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
    expect(within(debug).getByText(/show world layout zones/i)).toBeInTheDocument();
    expect(within(debug).getByText(/show free grids/i)).toBeInTheDocument();
    expect(within(debug).getByText("Maple bot")).toBeInTheDocument();
    expect(within(debug).getByText("ag-1")).toBeInTheDocument();
    expect(within(debug).getByText(/sid-local/)).toBeInTheDocument();
  });

  it("shows geography member count when world geography is enabled", async () => {
    const user = userEvent.setup();
    renderShell(
      <GameShell occupancyOrigin="http://localhost:3000" snapshot={snapshotWithStreet} />
    );
    const debug = screen.getByRole("complementary", { name: /game settings/i });
    expect(within(debug).queryByText(/members 1\/100/i)).not.toBeInTheDocument();
    await user.click(within(debug).getByRole("switch", { name: /world geography/i }));
    expect(within(debug).getByText(/members 1\/100/i)).toBeInTheDocument();
    expect(within(debug).getByRole("switch", { name: /world geography/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await user.click(within(debug).getByRole("switch", { name: /world layout zones/i }));
    expect(debug.querySelector(".play-radar-scope")).toBeNull();
    expect(within(debug).getByRole("switch", { name: /world layout zones/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("collapses a panel on a title click and keeps compact panels closed until opened", async () => {
    const originalMatchMedia = window.matchMedia;
    const user = userEvent.setup();
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      return {
        matches: query.includes("max-width: 860px"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
    try {
      renderShell(<GameShell />);
      const messages = screen.getByRole("region", { name: /world chat room/i });
      await waitFor(() => {
        expect(messages).toHaveAttribute("aria-expanded", "false");
      });
      await user.click(within(messages).getByRole("button", { name: /move world chat/i }));
      await waitFor(() => {
        expect(messages).toHaveAttribute("aria-expanded", "true");
      });
      await user.click(within(messages).getByRole("button", { name: /move world chat/i }));
      await waitFor(() => {
        expect(messages).toHaveAttribute("aria-expanded", "false");
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("repositions a panel after click, hold, and drag", () => {
    renderShell(<GameShell />);
    const messages = screen.getByRole("region", { name: /world chat room/i });
    const handle = within(messages).getByRole("button", { name: /move world chat/i });
    fireEvent.pointerDown(handle, { clientX: 40, clientY: 40, button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 180, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 180, clientY: 120, pointerId: 1 });
    expect(messages.style.left).not.toBe("");
    expect(messages.style.top).not.toBe("");
    const resize = within(messages).getByRole("button", { name: /resize world chat/i });
    fireEvent.pointerDown(resize, { clientX: 200, clientY: 200, button: 0, pointerId: 2 });
    fireEvent.pointerMove(resize, { clientX: 320, clientY: 280, pointerId: 2 });
    fireEvent.pointerUp(resize, { clientX: 320, clientY: 280, pointerId: 2 });
    expect(messages.style.width).not.toBe("");
  });

  it("opens Games G, wallet, and referral preview modals", async () => {
    const user = userEvent.setup();
    renderShell(<GameShell nodeId="node-derived" />);
    const dock = screen.getByRole("group", { name: /wallet and arcade/i });
    expect(dock).toHaveClass("play-hud-dock");
    await user.click(within(dock).getByRole("button", { name: /games g/i }));
    const games = screen.getByRole("dialog", { name: /arcade streak/i });
    expect(within(games).getByText(/day streak/i)).toBeInTheDocument();
    expect(within(games).getByText(/pu today/i)).toBeInTheDocument();
    expect(within(games).getByText(/featured cabinet/i)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(within(dock).getByRole("button", { name: /open wallet/i }));
    const wallet = screen.getByRole("dialog", { name: /wallet inventory/i });
    expect(within(wallet).getByText("$0.00")).toBeInTheDocument();
    expect(within(wallet).getByRole("button", { name: /house deed scan/i })).toBeInTheDocument();
    expect(within(wallet).getByAltText(/house deed scan/i)).toBeInTheDocument();
    await user.click(within(wallet).getByRole("button", { name: /title packet/i }));
    expect(within(wallet).getByTitle(/title packet/i)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(
      within(screen.getByRole("region", { name: /human agent interaction/i })).getByRole(
        "button",
        { name: /invite friends/i }
      )
    );
    const invite = screen.getByRole("dialog", { name: /invite friends/i });
    expect(within(invite).getByText(/\+25 apu/i)).toBeInTheDocument();
    expect(within(invite).getByText("Co-build")).toBeInTheDocument();
  });

  it("opens the wallet preview from the touch pad W key", async () => {
    const user = userEvent.setup();
    renderShell(<GameShell />);
    await user.click(screen.getByRole("button", { name: /^wallet$/i }));
    expect(screen.getByRole("dialog", { name: /wallet inventory/i })).toBeInTheDocument();
  });

  it("renders a caller world so the shell can mount elsewhere", () => {
    renderShell(
      <GameShell>
        <p>Custom occupancy canvas</p>
      </GameShell>
    );
    const shell = screen.getByRole("region", { name: /game shell/i });
    expect(within(shell).getByText(/custom occupancy canvas/i)).toBeInTheDocument();
    expect(
      within(shell).queryByRole("region", { name: /world movie/i })
    ).not.toBeInTheDocument();
  });

  it("prints occupancy wallet, arcade stats, and persisted chat on the play HUD", async () => {
    const user = userEvent.setup();
    const fetchFn = createOccupancyPlayFetch();
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        sid="sid-local"
        nodeId="node-derived"
        fetchFn={fetchFn}
        createEventSource={createSilentEventSource}
      />
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /open wallet/i })).toHaveTextContent(
        "$12.50"
      );
    });
    expect(screen.getByRole("button", { name: /open wallet/i })).toHaveTextContent("25");
    expect(await screen.findByText("hello street")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /games g/i }));
    const games = screen.getByRole("dialog", { name: /arcade streak/i });
    expect(within(games).getByText("3")).toBeInTheDocument();
    expect(within(games).getByText("hidden-gems")).toBeInTheDocument();
  });

  it("publishes a world chat line to occupancy", async () => {
    const user = userEvent.setup();
    const fetchFn = createOccupancyPlayFetch();
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        sid="sid-local"
        nodeId="node-derived"
        fetchFn={fetchFn}
        createEventSource={createSilentEventSource}
      />
    );
    await screen.findByText("hello street");
    const messages = screen.getByRole("region", { name: /world chat room/i });
    await user.type(
      within(messages).getByPlaceholderText(/say something to everyone/i),
      "from the plaza"
    );
    await user.click(within(messages).getByRole("button", { name: /^send$/i }));
    expect(within(messages).getByText("from the plaza")).toBeInTheDocument();
    expect(rpcOps(fetchFn)).toContain("worldChatPublish");
  });

  it("keeps pause-menu geography options after the debug panel remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <GameShell
          occupancyOrigin="http://localhost:3000"
          nodeId="node-derived"
          snapshot={snapshotWithStreet}
          createEventSource={createSilentEventSource}
        />
      </MemoryRouter>
    );
    const debug = screen.getByRole("complementary", { name: /debug/i });
    await user.click(within(debug).getByRole("switch", { name: /world geography/i }));
    unmount();
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        nodeId="node-derived"
        snapshot={snapshotWithStreet}
        createEventSource={createSilentEventSource}
      />
    );
    expect(
      within(screen.getByRole("complementary", { name: /game settings/i })).getByRole(
        "switch",
        { name: /world geography/i }
      )
    ).toHaveAttribute("aria-checked", "true");
  });

  it("shows occupancy notification previews in the player tray", async () => {
    const source = createMockEventSource();
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        sid="sid-local"
        nodeId="node-derived"
        fetchFn={createOccupancyPlayFetch()}
        createEventSource={() => source}
      />
    );
    await waitFor(() => {
      expect(source.listeners.size).toBeGreaterThan(0);
    });
    const like = buildMessageLikeNotification({
      id: "n-like-live",
      createdAt: "2026-08-21T12:00:00.000Z",
      actorPlayerId: "alice",
      targetPlayerId: "node-derived",
      messageRequestId: "msg-1",
      messagePreview: "hello street",
    });
    source.emit(WORLD_INTERCOM_SSE, {
      channelKey: "intercom:world:global",
      requestId: "msg-1",
      fromPlayerId: "alice",
      message: "hello street",
      ts: "2026-08-21T12:00:00.000Z",
      result: { notification: like, seq: 1 },
    });
    const tray = await screen.findByRole("region", { name: /notifications/i });
    expect(tray).toHaveTextContent("New like");
    expect(tray).toHaveTextContent("hello street");
    source.emit(WORLD_PLAYER_ADDED_SSE, {
      player: { nodeId: "carol", name: "Carol" },
    });
    expect(await screen.findByText(/carol joined the room/i)).toBeInTheDocument();
  });
});

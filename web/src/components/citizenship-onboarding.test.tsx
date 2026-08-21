import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitizenshipOnboarding } from "./citizenship-onboarding";
import { getMockCitizenshipCredential } from "../test-support/factories";

const jsonResponse = (body: unknown, ok = true): Response => {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
};

const PHRASE =
  "amber angle apple arch atlas aura autumn bamboo beacon birch";

const createFetchFn = () => {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/session")) {
      return jsonResponse({ sid: "sid-local" });
    }
    if (url.endsWith("/bootstrap")) {
      return jsonResponse({ rootKey: "ab".repeat(32) });
    }
    if (url.endsWith("/nodes/validate")) {
      return jsonResponse({ ok: true, nodeKind: "main" });
    }
    if (url.includes("/sdk/rpc")) {
      if (url.includes("sid=")) {
        return jsonResponse({ nodeId: "node-derived" });
      }
      return jsonResponse({ snapshot: { worldMap: { occupants: [] } } });
    }
    return jsonResponse({ error: "unknown" }, false);
  });
};

const renderOnboarding = (fetchFn: ReturnType<typeof createFetchFn>) => {
  const onEnteredWorld = vi.fn();
  render(
    <CitizenshipOnboarding
      occupancyOrigin="http://localhost:3000"
      fetchFn={fetchFn}
      generatePhrase={() => PHRASE}
      deriveCredential={async () => ({
        phrase: PHRASE,
        passwHash: "hash",
        nodeId: "node-derived",
      })}
      onEnteredWorld={onEnteredWorld}
    />
  );
  return { onEnteredWorld };
};

describe("v0peer citizenship onboarding", () => {
  it("starts on a v0peer citizenship welcome", () => {
    renderOnboarding(createFetchFn());
    expect(screen.getByText(/^v0peer$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /become a citizen/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start citizenship/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /i already have credentials/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /game shell/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /what to do now/i })
    ).toHaveTextContent(/pick a door/i);
    expect(screen.getByRole("button", { name: /i'm new/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /i've been here/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /induction progress/i })).toBeInTheDocument();
    expect(document.querySelector(".human-onboard-street-still")).toHaveAttribute(
      "src",
      expect.stringContaining("community-world-plaza")
    );
  });

  it("creates papers, downloads credentials, then enters the world", async () => {
    const user = userEvent.setup();
    const fetchFn = createFetchFn();
    const { onEnteredWorld } = renderOnboarding(fetchFn);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:credentials");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await user.click(screen.getByRole("button", { name: /start citizenship/i }));
    expect(
      screen.getByRole("status", { name: /what to do now/i })
    ).toHaveTextContent(/ten words/i);
    expect(document.querySelector(".human-onboard-dock")).not.toBeNull();
    expect(screen.getByRole("list", { name: /recovery key/i }).querySelectorAll("li")).toHaveLength(
      10
    );
    await user.click(
      screen.getByRole("checkbox", { name: /i agree to issue my player id/i })
    );
    await user.click(screen.getByRole("button", { name: /become a citizen/i }));

    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter world/i })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /download credentials\.json/i })
    );
    expect(URL.createObjectURL).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /enter world/i }));
    await waitFor(() => {
      expect(onEnteredWorld).toHaveBeenCalledWith({
        sid: "sid-local",
        nodeId: "node-derived",
        snapshot: { worldMap: { occupants: [] } },
        passw: PHRASE,
      });
    });
  });

  it("restores papers from credentials.json then enters the world", async () => {
    const user = userEvent.setup();
    const fetchFn = createFetchFn();
    const { onEnteredWorld } = renderOnboarding(fetchFn);

    await user.click(
      screen.getByRole("button", { name: /i already have credentials/i })
    );
    expect(
      screen.getByRole("status", { name: /what to do now/i })
    ).toHaveTextContent(/drop/i);
    const file = new File(
      [
        JSON.stringify(
          getMockCitizenshipCredential({
            serverUrl: "http://localhost:3000",
            nodeId: "node-derived",
          })
        ),
      ],
      "credentials.json",
      { type: "application/json" }
    );
    await user.upload(
      screen.getByLabelText(/open credentials\.json/i),
      file
    );

    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
    expect(screen.getByText("node-derived")).toBeInTheDocument();
    expect(screen.queryByText(PHRASE)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter world/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /enter world/i }));
    await waitFor(() => {
      expect(onEnteredWorld).toHaveBeenCalledWith({
        sid: "sid-local",
        nodeId: "node-derived",
        snapshot: { worldMap: { occupants: [] } },
        passw: PHRASE,
      });
    });
  });

  it("shows the found papers while occupancy checks them", async () => {
    const user = userEvent.setup();
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return jsonResponse({ sid: "sid-local" });
      }
      if (url.endsWith("/nodes/validate")) {
        await held;
        return jsonResponse({ ok: true, nodeKind: "main" });
      }
      return jsonResponse({ error: "unknown" }, false);
    });
    renderOnboarding(fetchFn);
    await user.click(
      screen.getByRole("button", { name: /i already have credentials/i })
    );
    await user.upload(
      screen.getByLabelText(/open credentials\.json/i),
      new File(
        [
          JSON.stringify(
            getMockCitizenshipCredential({
              serverUrl: "http://localhost:3000",
              nodeId: "node-derived",
            })
          ),
        ],
        "credentials.json",
        { type: "application/json" }
      )
    );
    expect(
      await screen.findByRole("status", { name: /found papers/i })
    ).toHaveTextContent("node-derived");
    expect(
      screen.getByRole("status", { name: /what to do now/i })
    ).toHaveTextContent(/checking/i);
    const tray = screen.getByRole("group", { name: /restore papers tray/i });
    expect(tray).toHaveAttribute("aria-busy", "true");
    expect(tray).toHaveTextContent(/checking papers/i);
    expect(screen.queryByText(PHRASE)).not.toBeInTheDocument();
    release();
    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
  });

  it("keeps Become a citizen loading until papers are sealed", async () => {
    const user = userEvent.setup();
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return jsonResponse({ sid: "sid-local" });
      }
      if (url.endsWith("/bootstrap")) {
        await held;
        return jsonResponse({ rootKey: "ab".repeat(32) });
      }
      if (url.includes("/sdk/rpc") && url.includes("sid=")) {
        return jsonResponse({ nodeId: "node-derived" });
      }
      return jsonResponse({ error: "unknown" }, false);
    });
    renderOnboarding(fetchFn);
    await user.click(screen.getByRole("button", { name: /start citizenship/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /i agree to issue my player id/i })
    );
    await user.click(screen.getByRole("button", { name: /become a citizen/i }));
    const stamp = await screen.findByRole("button", {
      name: /becoming a citizen/i,
    });
    expect(stamp).toHaveAttribute("aria-busy", "true");
    expect(stamp).toBeDisabled();
    release();
    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
  });

  it("keeps Enter world loading until the street opens", async () => {
    const user = userEvent.setup();
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return jsonResponse({ sid: "sid-local" });
      }
      if (url.endsWith("/nodes/validate")) {
        return jsonResponse({ ok: true, nodeKind: "main" });
      }
      if (url.includes("/sdk/rpc")) {
        await held;
        return jsonResponse({ snapshot: { worldMap: { occupants: [] } } });
      }
      return jsonResponse({ error: "unknown" }, false);
    });
    const { onEnteredWorld } = renderOnboarding(fetchFn);
    await user.click(
      screen.getByRole("button", { name: /i already have credentials/i })
    );
    await user.upload(
      screen.getByLabelText(/open credentials\.json/i),
      new File(
        [
          JSON.stringify(
            getMockCitizenshipCredential({
              serverUrl: "http://localhost:3000",
              nodeId: "node-derived",
            })
          ),
        ],
        "credentials.json",
        { type: "application/json" }
      )
    );
    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /enter world/i }));
    const enter = await screen.findByRole("button", {
      name: /entering world/i,
    });
    expect(enter).toHaveAttribute("aria-busy", "true");
    expect(enter).toBeDisabled();
    expect(onEnteredWorld).not.toHaveBeenCalled();
    release();
    await waitFor(() => {
      expect(onEnteredWorld).toHaveBeenCalledWith({
        sid: "sid-local",
        nodeId: "node-derived",
        snapshot: { worldMap: { occupants: [] } },
        passw: PHRASE,
      });
    });
  });

  it("rejects a broken credentials file before calling occupancy", async () => {
    const user = userEvent.setup();
    const fetchFn = createFetchFn();
    renderOnboarding(fetchFn);

    await user.click(
      screen.getByRole("button", { name: /i already have credentials/i })
    );
    await user.upload(
      screen.getByLabelText(/open credentials\.json/i),
      new File(["not json"], "credentials.json", { type: "application/json" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/json/i);
    expect(
      screen.queryByRole("heading", { name: /citizenship sealed/i })
    ).not.toBeInTheDocument();
    expect(
      fetchFn.mock.calls.some(([input]) => String(input).includes("/nodes/validate"))
    ).toBe(false);
  });

  it("accepts credentials.json dropped on the tray", async () => {
    const user = userEvent.setup();
    renderOnboarding(createFetchFn());
    await user.click(
      screen.getByRole("button", { name: /i already have credentials/i })
    );
    const tray = screen.getByRole("group", { name: /restore papers tray/i });
    const file = new File(
      [
        JSON.stringify(
          getMockCitizenshipCredential({
            serverUrl: "http://localhost:3000",
            nodeId: "node-derived",
          })
        ),
      ],
      "credentials.json",
      { type: "application/json" }
    );
    fireEvent.drop(tray, {
      dataTransfer: { files: [file] },
    });
    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
  });
});

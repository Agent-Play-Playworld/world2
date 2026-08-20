import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitizenshipOnboarding } from "./citizenship-onboarding";
import { getMockCitizenshipCredential } from "../test-support/factories";
import type { OccupancyFetch } from "../lib/occupancy-client";

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

const createFetchFn = (): OccupancyFetch => {
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

const renderOnboarding = (fetchFn: OccupancyFetch) => {
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
  });

  it("creates papers, downloads credentials, then enters the world", async () => {
    const user = userEvent.setup();
    const fetchFn = createFetchFn();
    const { onEnteredWorld } = renderOnboarding(fetchFn);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:credentials");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await user.click(screen.getByRole("button", { name: /start citizenship/i }));
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
      screen.getByLabelText(/upload credentials\.json/i),
      file
    );
    await user.click(screen.getByRole("button", { name: /reconnect/i }));

    expect(
      await screen.findByRole("heading", { name: /citizenship sealed/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /enter world/i }));
    await waitFor(() => {
      expect(onEnteredWorld).toHaveBeenCalledWith({
        sid: "sid-local",
        nodeId: "node-derived",
        snapshot: { worldMap: { occupants: [] } },
      });
    });
  });
});

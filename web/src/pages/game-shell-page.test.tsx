import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GameShellPage } from "./game-shell-page";
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

describe("game shell page", () => {
  it("shows the full play shell after citizenship is sealed and the world is entered", async () => {
    const user = userEvent.setup();
    const fetchFn: OccupancyFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return jsonResponse({ sid: "sid-local" });
      }
      if (url.endsWith("/bootstrap")) {
        return jsonResponse({ rootKey: "ab".repeat(32) });
      }
      if (url.includes("/sdk/rpc") && url.includes("sid=")) {
        return jsonResponse({ nodeId: "node-derived" });
      }
      if (url.includes("/sdk/rpc")) {
        return jsonResponse({ snapshot: { worldMap: { occupants: [] } } });
      }
      return jsonResponse({ error: "unknown" }, false);
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:credentials");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <GameShellPage
          occupancyOrigin="http://localhost:3000"
          fetchFn={fetchFn}
          generatePhrase={() => PHRASE}
          deriveCredential={async () => ({
            phrase: PHRASE,
            passwHash: "hash",
            nodeId: "node-derived",
          })}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /start citizenship/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /i agree to issue my player id/i })
    );
    await user.click(screen.getByRole("button", { name: /become a citizen/i }));
    await user.click(
      await screen.findByRole("button", { name: /download credentials\.json/i })
    );
    await user.click(screen.getByRole("button", { name: /enter world/i }));

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /game shell/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: /world canvas/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /play pad/i })).toHaveClass(
      "play-pad-center"
    );
    expect(screen.getByRole("toolbar", { name: /play menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /playback/i })).not.toBeInTheDocument();
  });
});

import type { ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GameShell } from "./game-shell";

const renderShell = (ui: ReactElement): void => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {ui}
    </MemoryRouter>
  );
};

describe("Game shell", () => {
  it("hosts a blank white world canvas with World 1 play chrome", () => {
    renderShell(<GameShell />);
    const shell = screen.getByRole("region", { name: /game shell/i });
    expect(within(shell).getByRole("img", { name: /world canvas/i })).toBeInTheDocument();
    expect(
      within(shell).queryByRole("region", { name: /world movie/i })
    ).not.toBeInTheDocument();
    expect(within(shell).getByRole("region", { name: /^messages$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("region", { name: /^session$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("group", { name: /play pad/i })).toHaveClass(
      "play-pad-center"
    );
    expect(within(shell).getByRole("group", { name: /touch pad/i })).toHaveClass(
      "play-touch-pad-cluster"
    );
    expect(within(shell).getByRole("button", { name: /^assist$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^chat$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^push$/i })).toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: /^wallet$/i })).toBeInTheDocument();
    expect(
      within(shell).queryByRole("group", { name: /playback/i })
    ).not.toBeInTheDocument();
    expect(
      within(shell).queryByRole("button", { name: /^previous$/i })
    ).not.toBeInTheDocument();
    expect(
      within(shell).queryByRole("button", { name: /^next$/i })
    ).not.toBeInTheDocument();
    expect(
      within(shell).queryByRole("heading", { name: /play the streets/i })
    ).not.toBeInTheDocument();
  });

  it("hides the debug panel until the footer menu toggle is pressed", async () => {
    const user = userEvent.setup();
    renderShell(
      <GameShell
        occupancyOrigin="http://localhost:3000"
        sid="sid-local"
        nodeId="node-derived"
        snapshot={{ worldMap: { occupants: [] } }}
      />
    );
    const shell = screen.getByRole("region", { name: /game shell/i });
    expect(
      within(shell).queryByRole("complementary", { name: /debug panel/i })
    ).not.toBeInTheDocument();
    const menu = within(shell).getByRole("toolbar", { name: /play menu/i });
    await user.click(within(menu).getByRole("button", { name: /debug panel/i }));
    const debug = within(shell).getByRole("complementary", {
      name: /debug panel/i,
    });
    expect(debug).toHaveTextContent("http://localhost:3000");
    expect(debug).toHaveTextContent("sid-local");
    expect(debug).toHaveTextContent("node-derived");
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
});

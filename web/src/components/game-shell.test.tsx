import type { ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
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
  it("hosts the default world movie without a copy stack", () => {
    renderShell(<GameShell />);
    const shell = screen.getByRole("region", { name: /game shell/i });
    expect(shell).toBeInTheDocument();
    expect(within(shell).getByRole("region", { name: /world movie/i })).toBeInTheDocument();
    expect(
      within(shell).queryByRole("heading", { name: /play the streets/i })
    ).not.toBeInTheDocument();
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

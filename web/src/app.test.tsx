import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./app";

const renderApp = (path: string): void => {
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );
};

describe("World 2 landing", () => {
  it("loads a quiet world movie over the full canvas", () => {
    renderApp("/");
    expect(
      screen.getByRole("heading", {
        name: /the next ai agent and human interaction metaverse/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/walk a live 3d world/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/world 2 is the next camera/i)
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("region", { name: /world movie/i })).toHaveLength(
      1
    );
  });

  it("plays composed world stills as a single movie", async () => {
    const user = userEvent.setup();
    renderApp("/");
    const movie = screen.getByRole("region", { name: /world movie/i });
    expect(within(movie).getByRole("img", { name: /come out/i })).toBeInTheDocument();
    await user.click(within(movie).getByRole("button", { name: /^next$/i }));
    expect(within(movie).getByRole("img", { name: /the plaza/i })).toBeInTheDocument();
    expect(within(movie).getByRole("button", { name: /^previous$/i })).toBeInTheDocument();
  });

  it("shows how money moves as its own section", () => {
    renderApp("/");
    const money = screen.getByRole("region", { name: /how money moves/i });
    expect(within(money).getByText(/\$10 APW\$/)).toBeInTheDocument();
    expect(within(money).getByText(/100 APU/i)).toBeInTheDocument();
    expect(within(money).getByRole("link", { name: /econext/i })).toHaveAttribute(
      "href",
      "https://econext.llc"
    );
  });

  it("links out to the live Agent Play world", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await user.hover(screen.getByRole("button", { name: /^play$/i }));
    const liveWorld = screen.getAllByRole("link", { name: /live world/i });
    expect(liveWorld.length).toBeGreaterThan(0);
    for (const link of liveWorld) {
      expect(link).toHaveAttribute("href", "https://agent-play.com");
    }
  });
});

describe("game shell page", () => {
  it("hosts the reusable game UI on /game-shell", () => {
    renderApp("/game-shell");
    expect(screen.getByRole("region", { name: /game shell/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /world movie/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /play the streets/i })
    ).not.toBeInTheDocument();
  });
});

describe("World 2 chrome", () => {
  it("keeps a translucent navbar over the world", () => {
    renderApp("/");
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("site-header-overlay");
    expect(screen.getByRole("region", { name: /game shell/i })).toBeInTheDocument();
  });

  it("shows professional nav groups with engineering sublinks", async () => {
    const user = userEvent.setup();
    renderApp("/");
    expect(screen.getByRole("navigation", { name: /world 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^launch$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^citizens$/i })).toBeInTheDocument();
    await user.hover(screen.getByRole("button", { name: /^engineering$/i }));
    expect(screen.getByRole("link", { name: /^webgl$/i })).toHaveAttribute(
      "href",
      "/webgl"
    );
    expect(screen.getByRole("link", { name: /^rust$/i })).toHaveAttribute(
      "href",
      "/rust"
    );
    expect(screen.getByRole("link", { name: /native c/i })).toHaveAttribute(
      "href",
      "/c"
    );
    expect(screen.getByRole("link", { name: /^visage$/i })).toHaveAttribute(
      "href",
      "/visage"
    );
  });
});

describe("launch interest", () => {
  it("records show-interest from the interest page", async () => {
    const user = userEvent.setup();
    renderApp("/interest");

    await user.type(
      screen.getByLabelText(/email/i),
      "launch@example.com"
    );
    await user.click(
      screen.getByRole("button", { name: /show interest in the game launch/i })
    );

    expect(
      screen.getByText(/we will tell you when world 2 launches/i)
    ).toBeInTheDocument();
  });
});

describe("asset store", () => {
  it("asks for a citizenship credential before a purchase", async () => {
    const user = userEvent.setup();
    renderApp("/assets");

    expect(
      screen.getByRole("heading", {
        name: /upload your citizenship credential/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /buy avatar set/i }));
    expect(
      screen.getByText(/upload a citizenship credential before buying an asset/i)
    ).toBeInTheDocument();
  });
});

describe("experience rooms", () => {
  it("opens a developers hub with WebGL, Rust, C, and Visage", () => {
    renderApp("/developers");
    const main = screen.getByRole("main");
    expect(
      screen.getByRole("heading", { name: /developers/i })
    ).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /^webgl$/i })).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /^rust$/i })).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /native c/i })).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: /^visage$/i })).toBeInTheDocument();
  });

  it("credits the Visage repository", () => {
    renderApp("/visage");
    expect(
      screen.getByRole("link", { name: /ready player me visage/i })
    ).toHaveAttribute("href", "https://github.com/readyplayerme/visage");
  });
});

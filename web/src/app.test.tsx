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
  it("loads the cinematic landing by default", () => {
    renderApp("/");
    expect(
      screen.getByRole("heading", { name: /come out with us/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show interest in the game launch/i })
    ).toBeInTheDocument();
  });

  it("plays art-ref stills in a story carousel", async () => {
    const user = userEvent.setup();
    renderApp("/");
    const story = screen.getByRole("region", { name: /story reel/i });
    expect(story).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /come out/i })).toBeInTheDocument();
    await user.click(within(story).getByRole("button", { name: /next still/i }));
    expect(
      screen.getByRole("img", { name: /walk with us/i })
    ).toBeInTheDocument();
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

describe("World 2 chrome", () => {
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

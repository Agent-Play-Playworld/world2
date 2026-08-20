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
  it("opens full-bleed movie and network covers, then the join-early pitch", () => {
    renderApp("/");
    const hero = screen.getByRole("region", { name: /world 2 opening/i });
    expect(hero).toHaveClass("landing-hero-covers");
    expect(within(hero).getByRole("region", { name: /world movie/i })).toHaveClass(
      "frame-carousel-hero"
    );
    const network = within(hero).getByRole("region", {
      name: /agent play network/i,
    });
    expect(within(network).getByRole("img", { name: /money flow map/i })).toBeInTheDocument();
    expect(within(network).queryByText(/\$10 APW\$/)).not.toBeInTheDocument();
    expect(
      within(hero).queryByRole("heading", { name: /join early/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /join early: world 2 is the next ai agent and human interaction metaverse, and the streets still have room for your name\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /humans and agents already share maple ave, the shops, and the bank/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start citizenship/i })).toHaveAttribute(
      "href",
      "https://agent-play.com"
    );
    expect(screen.getByRole("link", { name: /sell apu/i })).toHaveAttribute(
      "href",
      "https://econext.llc/sell-apu"
    );
    expect(screen.queryByRole("region", { name: /game shell/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/walk a live 3d world/i)).not.toBeInTheDocument();
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
    await user.click(within(movie).getByRole("button", { name: /^previous$/i }));
    expect(within(movie).getByRole("img", { name: /come out/i })).toBeInTheDocument();
  });

  it("shows how money moves as its own section", () => {
    renderApp("/");
    const money = screen.getByRole("region", { name: /how money moves/i });
    expect(within(money).queryByRole("img", { name: /money flow map/i })).not.toBeInTheDocument();
    expect(within(money).getByText(/\$10 APW\$/)).toBeInTheDocument();
    expect(within(money).getByText(/100 APU/i)).toBeInTheDocument();
    expect(within(money).getByRole("link", { name: /econext/i })).toHaveAttribute(
      "href",
      "https://econext.llc"
    );
  });

  it("links Play to the game shell and Banking to Econext", () => {
    renderApp("/");
    const nav = screen.getByRole("navigation", { name: /world 2/i });
    expect(within(nav).getByRole("link", { name: /^play$/i })).toHaveAttribute(
      "href",
      "/game-shell"
    );
    expect(within(nav).getByRole("link", { name: /^banking$/i })).toHaveAttribute(
      "href",
      "https://econext.llc"
    );
    expect(within(nav).queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("game shell page", () => {
  it("opens v0peer citizenship onboarding without marketing chrome", () => {
    renderApp("/game-shell");
    expect(screen.getByText(/^v0peer$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /become a citizen/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /world 2/i })
    ).not.toBeInTheDocument();
    expect(document.querySelector(".custom-cursor")).toBeNull();
    expect(document.documentElement).toHaveClass("game-shell-route");
    expect(screen.queryByRole("region", { name: /game shell/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /playback/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /play the streets/i })
    ).not.toBeInTheDocument();
  });
});

describe("World 2 chrome", () => {
  it("keeps a translucent navbar over the opening", () => {
    renderApp("/");
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("site-header-overlay");
    expect(screen.getByRole("region", { name: /world 2 opening/i })).toBeInTheDocument();
  });

  it("shows Play and Banking in the navbar", () => {
    renderApp("/");
    const nav = screen.getByRole("navigation", { name: /world 2/i });
    expect(within(nav).getByRole("link", { name: /^play$/i })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /^banking$/i })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^launch$/i })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: /^engineering$/i })).not.toBeInTheDocument();
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

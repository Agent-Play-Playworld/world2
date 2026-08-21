import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COLLAPSED_PANEL_HEIGHT_PX } from "../lib/play-preview";
import { FloatingPanel } from "./floating-panel";

const OPEN_HEIGHT_PX = 320;

const PanelProbe = () => {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <FloatingPanel
      label="World chat room"
      moveLabel="Move world chat panel"
      className="play-panel-messages"
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      <p>hello street</p>
    </FloatingPanel>
  );
};

describe("floating panel expand height", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const collapsed = this.classList.contains("is-collapsed");
        const explicit = Number.parseFloat(this.style.height);
        const height = collapsed
          ? COLLAPSED_PANEL_HEIGHT_PX
          : this.style.height === "auto" || this.style.height === ""
            ? OPEN_HEIGHT_PX
            : Number.isFinite(explicit)
              ? explicit
              : OPEN_HEIGHT_PX;
        return {
          x: 0,
          y: 0,
          width: 320,
          height,
          top: 0,
          left: 0,
          right: 320,
          bottom: height,
          toJSON: () => ({}),
        };
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("eases open to the measured fold height, then follows added and removed space", async () => {
    const user = userEvent.setup();
    render(<PanelProbe />);
    const panel = screen.getByRole("region", { name: /world chat room/i });
    await user.click(screen.getByRole("button", { name: /move world chat/i }));
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    expect(panel.style.height).toBe(`${String(OPEN_HEIGHT_PX)}px`);
    const eased = new Event("transitionend");
    Object.defineProperty(eased, "propertyName", { value: "height" });
    panel.dispatchEvent(eased);
    expect(panel.style.height).toBe("");
  });
});

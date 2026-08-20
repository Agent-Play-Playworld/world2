import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ParallaxBand } from "./parallax-band";

describe("Parallax band", () => {
  it("shifts a slower layer when the page scrolls", () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 400 });
    render(
      <ParallaxBand speed={0.35}>
        <p>Padded copy</p>
      </ParallaxBand>
    );
    fireEvent.scroll(window);
    const band = document.querySelector("[data-parallax='true']");
    expect(band).not.toBeNull();
    expect(band).toHaveStyle({
      transform: "translate3d(0, 140px, 0)",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { scrollToElement } from "./smooth-scroll";

describe("smooth scroll", () => {
  it("scrolls the target into view smoothly", () => {
    const scrollIntoView = vi.fn();
    const element = { scrollIntoView } as unknown as HTMLElement;

    scrollToElement({ element });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});

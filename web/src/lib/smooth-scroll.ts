export type ScrollToElementOptions = {
  element: Pick<HTMLElement, "scrollIntoView">;
};

export const scrollToElement = (options: ScrollToElementOptions): void => {
  options.element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

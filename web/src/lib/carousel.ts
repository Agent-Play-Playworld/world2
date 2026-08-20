export type CarouselDirection = "next" | "prev";

export type StepCarouselIndexOptions = {
  index: number;
  length: number;
  direction: CarouselDirection;
};

export const stepCarouselIndex = (options: StepCarouselIndexOptions): number => {
  const { index, length, direction } = options;
  if (length <= 0) {
    return 0;
  }
  if (direction === "next") {
    return (index + 1) % length;
  }
  return (index - 1 + length) % length;
};

export type ParallaxOffsetOptions = {
  scrollY: number;
  speed: number;
};

export const parallaxOffset = (options: ParallaxOffsetOptions): number => {
  return options.scrollY * options.speed;
};

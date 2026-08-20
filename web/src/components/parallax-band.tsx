import { useEffect, useState, type ReactNode } from "react";
import { parallaxOffset } from "../lib/parallax";

type ParallaxBandProps = {
  speed: number;
  children: ReactNode;
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

export const ParallaxBand = (options: ParallaxBandProps) => {
  const { speed, children } = options;
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const offset = prefersReducedMotion()
    ? 0
    : parallaxOffset({ scrollY, speed });

  return (
    <div
      className="parallax-band"
      data-parallax="true"
      style={{ transform: `translate3d(0, ${String(offset)}px, 0)` }}
    >
      {children}
    </div>
  );
};

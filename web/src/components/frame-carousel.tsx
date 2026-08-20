import { useEffect, useState } from "react";
import { ART_REEL_FRAMES, artRefPublicPath } from "../lib/art-reel";
import { stepCarouselIndex } from "../lib/carousel";
import type { ArtReelFrame } from "../schemas/art-reel";

type FrameCarouselVariant = "hero" | "story" | "film";

type FrameCarouselProps = {
  label: string;
  frames?: readonly ArtReelFrame[];
  variant: FrameCarouselVariant;
  autoPlayMs?: number;
  decorative?: boolean;
};

const prefersReducedMotion = (): boolean => {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

export const FrameCarousel = (options: FrameCarouselProps) => {
  const {
    label,
    frames = ART_REEL_FRAMES,
    variant,
    autoPlayMs,
    decorative = false,
  } = options;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = frames[index];

  useEffect(() => {
    if (autoPlayMs === undefined || paused || prefersReducedMotion()) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) =>
        stepCarouselIndex({
          index: current,
          length: frames.length,
          direction: "next",
        })
      );
    }, autoPlayMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [autoPlayMs, frames.length, paused]);

  if (active === undefined) {
    return null;
  }

  const go = (direction: "next" | "prev") => {
    setPaused(true);
    setIndex((current) =>
      stepCarouselIndex({
        index: current,
        length: frames.length,
        direction,
      })
    );
  };

  return (
    <section
      className={`frame-carousel frame-carousel-${variant}`}
      aria-label={label}
      aria-roledescription="carousel"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="carousel-stage">
        {frames.map((frame, frameIndex) => {
          const isActive = frameIndex === index;
          return (
            <figure
              key={frame.file}
              className={isActive ? "carousel-slide is-active" : "carousel-slide"}
              aria-hidden={!isActive}
            >
              <img
                className="carousel-still"
                data-design="true"
                src={artRefPublicPath(frame.file)}
                alt={decorative ? "" : frame.title}
              />
            </figure>
          );
        })}
      </div>
      {variant !== "hero" ? (
        <div className="carousel-copy">
          <p className="reel-kicker">World 2</p>
          <h2>{active.title}</h2>
          <p>{active.caption}</p>
        </div>
      ) : null}
      <div className="carousel-controls">
        <button type="button" className="carousel-btn" onClick={() => go("prev")}>
          Previous still
        </button>
        <div className="carousel-dots" role="tablist" aria-label={`${label} stills`}>
          {frames.map((frame, frameIndex) => (
            <button
              key={frame.file}
              type="button"
              role="tab"
              aria-selected={frameIndex === index}
              className={
                frameIndex === index ? "carousel-dot is-active" : "carousel-dot"
              }
              onClick={() => {
                setPaused(true);
                setIndex(frameIndex);
              }}
            >
              {frame.title}
            </button>
          ))}
        </div>
        <button type="button" className="carousel-btn" onClick={() => go("next")}>
          Next still
        </button>
      </div>
    </section>
  );
};

import type { ReactNode } from "react";
import { FrameCarousel } from "./frame-carousel";
import { WORLD_MOVIE_FRAMES } from "../lib/art-reel";

type GameShellProps = {
  children?: ReactNode;
  hud?: ReactNode;
};

const DefaultWorld = () => {
  return (
    <FrameCarousel
      label="World movie"
      variant="hero"
      frames={WORLD_MOVIE_FRAMES}
      autoPlayMs={3600}
    />
  );
};

export const GameShell = (options: GameShellProps) => {
  const { children, hud } = options;
  return (
    <section className="game-shell" aria-label="Game shell">
      <div className="game-shell-world">{children ?? <DefaultWorld />}</div>
      {hud !== undefined ? <div className="game-shell-hud">{hud}</div> : null}
    </section>
  );
};

import { FrameCarousel } from "./frame-carousel";
import { MoneyFlowMap } from "./money-flow-map";
import { WORLD_MOVIE_FRAMES } from "../lib/art-reel";

export const LandingHero = () => {
  return (
    <section
      className="landing-hero landing-hero-covers"
      aria-label="World 2 opening"
    >
      <div className="landing-hero-cover landing-hero-cover-movie">
        <FrameCarousel
          label="World movie"
          variant="hero"
          frames={WORLD_MOVIE_FRAMES}
          autoPlayMs={3600}
        />
      </div>
      <section
        className="landing-hero-cover landing-hero-cover-network"
        id="money-flow"
        aria-label="Agent Play network"
      >
        <p className="reel-kicker landing-hero-network-kicker">
          Agent Play network
        </p>
        <MoneyFlowMap />
      </section>
    </section>
  );
};

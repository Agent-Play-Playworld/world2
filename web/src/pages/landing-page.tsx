import { useNavigate } from "react-router-dom";
import { FrameCarousel } from "../components/frame-carousel";
import { ART_REEL_FRAMES } from "../lib/art-reel";
import { GAME_SITE_HREF } from "../lib/origins";
import { scrollToElement } from "../lib/smooth-scroll";

const nightIndexes = [5, 6, 7, 10] as const;
const NIGHT_FRAMES = nightIndexes.flatMap((nightIndex) => {
  const frame = ART_REEL_FRAMES[nightIndex];
  return frame === undefined ? [] : [frame];
});

export const LandingPage = () => {
  const navigate = useNavigate();

  const onShowInterest = () => {
    const section = document.getElementById("launch-interest");
    if (section === null) {
      navigate("/interest");
      return;
    }
    scrollToElement({ element: section });
  };

  return (
    <main className="landing-page">
      <section className="hero" id="hero">
        <FrameCarousel
          label="Opening nights"
          variant="hero"
          autoPlayMs={4200}
          decorative={true}
        />
        <div className="hero-copy">
          <p className="reel-kicker">Agent Play World 2</p>
          <h1>Come out with us. Earn. Take it home.</h1>
          <p className="lead">
            A 3D camera on the same live streets as Agent Play. The stills move.
            The launch is open for interest. The world you can walk is already
            live.
          </p>
          <div className="hero-actions">
            <button className="cta" type="button" onClick={onShowInterest}>
              Show interest in the game launch
            </button>
            <a className="cta cta-ghost" href={GAME_SITE_HREF}>
              Live world
            </a>
          </div>
        </div>
      </section>
      <FrameCarousel
        label="Story reel"
        variant="story"
        autoPlayMs={7000}
      />
      <FrameCarousel
        label="World nights"
        variant="film"
        frames={NIGHT_FRAMES}
        autoPlayMs={5200}
      />
      <section className="closing" id="launch-interest">
        <h2>The night is already moving</h2>
        <p>
          World 2 is the next camera. Maple Ave, the shops, and the bank stay on{" "}
          <a href={GAME_SITE_HREF}>agent-play.com</a>. Leave your name for the
          launch show.
        </p>
        <button className="cta" type="button" onClick={() => navigate("/interest")}>
          Register interest
        </button>
      </section>
    </main>
  );
};

import { useNavigate } from "react-router-dom";
import { CinematicReel } from "../components/cinematic-reel";
import { GAME_SITE_HREF } from "../lib/origins";
import { scrollToElement } from "../lib/smooth-scroll";

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
        <p className="reel-kicker">Agent Play World 2</p>
        <h1>Come out with us. Earn. Take it home.</h1>
        <p className="lead">
          A 3D camera on the same live streets as Agent Play. Watch the stills.
          Show interest in the launch. Walk the world that is already open.
        </p>
        <div className="hero-actions">
          <button className="cta" type="button" onClick={onShowInterest}>
            Show interest in the game launch
          </button>
          <a className="cta cta-ghost" href={GAME_SITE_HREF}>
            Enter the world
          </a>
        </div>
      </section>
      <CinematicReel />
      <section className="closing" id="launch-interest">
        <h2>The night is already moving</h2>
        <p>
          World 2 is the next camera. Maple Ave, the shops, and the bank stay on{" "}
          <a href={GAME_SITE_HREF}>agent-play.com</a>. Leave your name for the
          launch show.
        </p>
        <button className="cta" type="button" onClick={() => navigate("/interest")}>
          Leave your interest
        </button>
      </section>
    </main>
  );
};

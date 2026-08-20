import { useNavigate } from "react-router-dom";
import { GameShell } from "../components/game-shell";
import { MoneyFlowSection } from "../components/money-flow-section";
import { ParallaxBand } from "../components/parallax-band";
import { GAME_SITE_HREF } from "../lib/origins";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <GameShell />
      <ParallaxBand speed={0.12}>
        <section className="page-band" aria-label="World 2">
          <p className="reel-kicker">Agent Play World 2</p>
          <h1>The next AI Agent and Human Interaction Metaverse</h1>
          <p className="lead">
            Humans and agents share the same streets, shops, and game center.
            Maple Ave, the malls, and the bank stay on{" "}
            <a href={GAME_SITE_HREF}>agent-play.com</a>.
          </p>
        </section>
      </ParallaxBand>
      <ParallaxBand speed={0.18}>
        <div className="page-band">
          <MoneyFlowSection />
        </div>
      </ParallaxBand>
      <ParallaxBand speed={0.08}>
        <section className="page-band closing" id="launch-interest">
          <h2>The night is already moving</h2>
          <p>
            Come out. Earn. Take it home. Leave your name for the launch show.
          </p>
          <button
            className="cta"
            type="button"
            onClick={() => navigate("/interest")}
          >
            Register interest
          </button>
        </section>
      </ParallaxBand>
    </main>
  );
};

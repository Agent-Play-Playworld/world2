import { Link } from "react-router-dom";
import { LandingHero } from "../components/landing-hero";
import { MoneyFlowSection } from "../components/money-flow-section";
import { ParallaxBand } from "../components/parallax-band";
import { LANDING_HERO } from "../lib/landing-hero";

export const LandingPage = () => {
  return (
    <main className="landing-page">
      <LandingHero />
      <ParallaxBand speed={0.12}>
        <section className="page-band landing-pitch" aria-label="Join early">
          <p className="reel-kicker">Agent Play World 2</p>
          <h1>{LANDING_HERO.title}</h1>
          <p className="lead">{LANDING_HERO.body}</p>
          <div className="hero-actions">
            <a
              className="cta"
              href={LANDING_HERO.citizenshipCta.href}
              rel="noreferrer"
            >
              {LANDING_HERO.citizenshipCta.label}
            </a>
            <a
              className="cta cta-ghost"
              href={LANDING_HERO.sellApuCta.href}
              rel="noreferrer"
            >
              {LANDING_HERO.sellApuCta.label}
            </a>
          </div>
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
          <Link className="cta" to="/interest">
            Register interest
          </Link>
        </section>
      </ParallaxBand>
    </main>
  );
};

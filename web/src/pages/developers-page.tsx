import { Link } from "react-router-dom";
import { ExperienceLayout } from "../components/experience-layout";
import { EXPERIENCE_ROUTES } from "../lib/routes";
import { GAME_SITE_HREF } from "../lib/origins";

export const DevelopersPage = () => {
  return (
    <ExperienceLayout
      kicker="Rooms for builders"
      title="Developers"
      lead="World 2 is a Vite TypeScript WebGL client of Agent Play occupancy. Pick the room that matches how you like to build."
    >
      <div className="experience-links">
        {EXPERIENCE_ROUTES.filter((route) => route.id !== "developers").map(
          (route) => (
            <Link key={route.id} className="cta" to={route.path}>
              {route.label}
            </Link>
          )
        )}
        <a className="cta cta-ghost" href={GAME_SITE_HREF}>
          Occupancy host
        </a>
      </div>
    </ExperienceLayout>
  );
};

import { ExperienceLayout } from "../components/experience-layout";
import { GAME_SITE_HREF } from "../lib/origins";

export const WebglPage = () => {
  return (
    <ExperienceLayout
      kicker="Three.js / WebGL"
      title="WebGL developers"
      lead="The World 2 canvas is WebGL. Occupancy stays JSON from agent-play.com. You instance looks; you do not host the map."
    >
      <p>
        Phase 1 is a ground plane, stand-ins, and a third-person camera. Kit GLBs
        from png2glb dress those poses later. Read the occupancy OpenAPI, then
        draw.
      </p>
      <a className="cta" href={GAME_SITE_HREF}>
        Open the live 2D world
      </a>
    </ExperienceLayout>
  );
};

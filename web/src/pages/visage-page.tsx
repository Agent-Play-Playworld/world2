import { ExperienceLayout } from "../components/experience-layout";
import { VISAGE_REPOSITORY_HREF } from "../lib/origins";
import { VisageStage } from "./visage-stage";

export const VisagePage = () => {
  return (
    <ExperienceLayout
      kicker="Avatar room"
      title="Visage"
      lead="Ready Player Me visages on the web. World 2 uses this room to show a body you could walk in public with, before occupancy dresses the streets."
    >
      <a className="cta" href={VISAGE_REPOSITORY_HREF}>
        Ready Player Me Visage
      </a>
      <VisageStage />
    </ExperienceLayout>
  );
};

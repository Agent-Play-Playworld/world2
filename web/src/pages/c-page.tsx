import { ExperienceLayout } from "../components/experience-layout";

export const CPage = () => {
  return (
    <ExperienceLayout
      kicker="Native room"
      title="C"
      lead="A room for C and native renderer people. World 2 v1 is a browser WebGL client. Native engines are parked, not the occupancy source of truth."
    >
      <p>
        Bring the discipline: explicit memory, explicit frames. The live streets
        still come from snapshot JSON. A C client would be another camera on the
        same host, never a private map.
      </p>
    </ExperienceLayout>
  );
};

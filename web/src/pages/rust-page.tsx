import { ExperienceLayout } from "../components/experience-layout";

export const RustPage = () => {
  return (
    <ExperienceLayout
      kicker="Systems room"
      title="Rust Experience"
      lead="A room for people who think in ownership, safety, and long-running hosts. World 2 itself is TypeScript in the browser. The occupancy host is Agent Play."
    >
      <p>
        If you ship agents or host tooling in Rust, you still speak the same HTTP
        and SSE contract. Do not stand up a second occupancy server. Point
        credentials at agent-play.com.
      </p>
    </ExperienceLayout>
  );
};

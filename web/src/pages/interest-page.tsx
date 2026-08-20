import { LaunchInterestForm } from "../components/launch-interest-form";

export const InterestPage = () => {
  return (
    <main className="experience-page">
      <p className="reel-kicker">Launch show</p>
      <h1>Show interest in World 2</h1>
      <p className="lead">
        World 2 is the next AI Agent and Human Interaction Metaverse. The world
        you walk today is already live. Leave an email and we will tell you when
        this page becomes play.
      </p>
      <LaunchInterestForm />
    </main>
  );
};

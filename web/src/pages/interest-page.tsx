import { LaunchInterestForm } from "../components/launch-interest-form";

export const InterestPage = () => {
  return (
    <main className="experience-page">
      <p className="reel-kicker">Launch show</p>
      <h1>Show interest in World 2</h1>
      <p className="lead">
        The 3D camera is coming. The world you walk today is already live. Leave
        an email and we will tell you when this page becomes play.
      </p>
      <LaunchInterestForm />
    </main>
  );
};

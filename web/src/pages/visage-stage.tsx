import { lazy, Suspense } from "react";
import { VISAGE_DEMO_MODEL_SRC } from "../lib/origins";

const VisageAvatar = lazy(async () => {
  const module = await import("./visage-avatar");
  return { default: module.VisageAvatar };
});

const VisageFallback = () => {
  return (
    <div className="visage-stage" data-design="true">
      <iframe
        title="Ready Player Me Visage avatar"
        src={`https://readyplayerme.github.io/visage/?model=${encodeURIComponent(VISAGE_DEMO_MODEL_SRC)}`}
        allow="autoplay; xr-spatial-tracking"
      />
    </div>
  );
};

export const VisageStage = () => {
  if (import.meta.env.MODE === "test") {
    return <VisageFallback />;
  }

  return (
    <div className="visage-stage">
      <Suspense fallback={<p>Loading Visage…</p>}>
        <VisageAvatar />
      </Suspense>
      <p className="visage-note">
        Demo model from the Visage project. Your World 2 avatar set is reserved
        in Assets after citizenship.
      </p>
    </div>
  );
};

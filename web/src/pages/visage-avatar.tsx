import { Avatar } from "@readyplayerme/visage";
import { VISAGE_DEMO_MODEL_SRC } from "../lib/origins";

export const VisageAvatar = () => {
  return (
    <div className="visage-canvas" data-design="true">
      <Avatar modelSrc={VISAGE_DEMO_MODEL_SRC} />
    </div>
  );
};

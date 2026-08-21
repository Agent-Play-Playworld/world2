import { artRefPublicPath } from "./art-reel";
import {
  InductionGateSchema,
  type InductionBusyAction,
  type InductionGate,
  type InductionStepId,
} from "../schemas/citizenship-induction";

const RAW_GATES: readonly InductionGate[] = [
  {
    id: "new",
    title: "I'm new",
    action: "Start citizenship",
    hint: "Get papers at this desk. Ten words, then a stamp.",
  },
  {
    id: "return",
    title: "I've been here",
    action: "I already have credentials",
    hint: "Open credentials.json. We read it here, then open the street.",
  },
];

export const INDUCTION_GATES: readonly InductionGate[] = RAW_GATES.map((gate) =>
  InductionGateSchema.parse(gate)
);

export const INDUCTION_TRACK = [
  { id: "gate", label: "Gate", steps: ["welcome"] },
  { id: "desk", label: "Desk", steps: ["papers", "restore"] },
  { id: "stamp", label: "Stamp", steps: ["sealed"] },
  { id: "street", label: "Street", steps: [] },
] as const;

export const INDUCTION_BRAND = "v0peer";

export const INDUCTION_NEXT: Record<InductionStepId, string> = {
  welcome: "Pick a door. That is the only choice on this counter.",
  papers: "Keep the ten words. Sign. Then stamp your papers.",
  restore: "Open credentials.json, or drop it on this tray.",
  sealed: "Take your papers home. Then walk onto the street.",
};

export const INDUCTION_NEXT_RESTORED =
  "Your papers are already with you. Walk onto the street.";

export const INDUCTION_NEXT_CHECKING =
  "Hold on. We are checking these papers.";

export const INDUCTION_BUSY_LABEL: Record<InductionBusyAction, string> = {
  "become-citizen": "Becoming a citizen",
  restore: "Checking papers",
  "enter-world": "Entering world",
};

export const INDUCTION_STREET_FILE: Record<InductionStepId, string> = {
  welcome: "agent-play-community-world-plaza.png",
  papers: "agent-play-sunny-park-world.png",
  restore: "agent-play-phone-store-world.png",
  sealed: "agent-play-come-out-earn-take-it-home.png",
};

export const inductionStreetSrc = (step: InductionStepId): string => {
  return artRefPublicPath(INDUCTION_STREET_FILE[step]);
};

export const recoveryKeyWords = (phrase: string): readonly string[] => {
  return phrase.trim().split(/\s+/u).filter((word) => word.length > 0);
};

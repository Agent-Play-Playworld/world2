import { ArtReelFrameSchema, type ArtReelFrame } from "../schemas/art-reel";

const RAW_FRAMES: readonly ArtReelFrame[] = [
  {
    file: "agent-play-sunny-park-world.png",
    title: "Come out",
    caption: "A public place. Friends already on the grass.",
  },
  {
    file: "agent-play-community-world-plaza.png",
    title: "Walk with us",
    caption: "A plaza that remembers who showed up.",
  },
  {
    file: "agent-play-coffee-break-conversation.png",
    title: "Stay longer",
    caption: "Talk that fits in a coffee break, and then does not.",
  },
  {
    file: "agent-play-meeting-legal-assistant.png",
    title: "Meet someone",
    caption: "The agent you came to talk to is actually there.",
  },
  {
    file: "agent-play-legal-assistant-world.png",
    title: "Share the floor",
    caption: "Humans and agents on the same street.",
  },
  {
    file: "agent-play-phone-store-world.png",
    title: "Buy the small thing",
    caption: "Shops where sold stays sold.",
  },
  {
    file: "agent-play-city-that-carries-the-weight.png",
    title: "The city holds it",
    caption: "A world that carries the night with you.",
  },
  {
    file: "agent-play-capacity-reaches-others.png",
    title: "Bring a friend",
    caption: "What you earn can reach someone else.",
  },
  {
    file: "agent-play-bots-banking-linkedin.png",
    title: "Bank it",
    caption: "Earnings that can sit until you are ready.",
  },
  {
    file: "econext-referrals-25-apu.png",
    title: "Send twenty-five reasons",
    caption: "Invite someone who will actually arrive.",
  },
  {
    file: "agent-play-come-out-earn-take-it-home.png",
    title: "Take it home",
    caption: "Come out. Earn. Leave with something that follows you.",
  },
];

export const ART_REEL_FRAMES: readonly ArtReelFrame[] = RAW_FRAMES.map((frame) =>
  ArtReelFrameSchema.parse(frame)
);

export const artRefPublicPath = (file: string): string => {
  return `/art/refs/${file}`;
};

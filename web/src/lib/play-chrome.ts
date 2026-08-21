import {
  PlayPanelIdSchema,
  PlayTouchKeySchema,
  type PlayPanelId,
  type PlayTouchKey,
} from "../schemas/play-chrome";

const RAW_TOUCH_KEYS: readonly PlayTouchKey[] = [
  { id: "assist", letter: "A", label: "Assist" },
  { id: "chat", letter: "C", label: "Chat" },
  { id: "talk", letter: "P", label: "Push" },
  { id: "wallet", letter: "W", label: "Wallet" },
];

export const PLAY_TOUCH_KEYS: readonly PlayTouchKey[] = RAW_TOUCH_KEYS.map(
  (key) => PlayTouchKeySchema.parse(key)
);

export const PLAY_PANEL_IDS: readonly PlayPanelId[] = [
  PlayPanelIdSchema.parse("messages"),
  PlayPanelIdSchema.parse("session"),
  PlayPanelIdSchema.parse("debug"),
];

export const COMPACT_PLAY_CHROME_QUERY = "(max-width: 860px)";
export const HUD_DOCK_WIDE_QUERY = "(min-width: 1024px)";
export const SESSION_PANEL_MAX_WIDTH_PX = 640;

export const isCompactPlayChrome = (
  media: { matches: boolean } | null
): boolean => {
  return media?.matches === true;
};

export const isWideHudDock = (media: { matches: boolean } | null): boolean => {
  return media?.matches === true;
};

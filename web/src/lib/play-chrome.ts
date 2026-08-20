import {
  PlayFooterMenuItemSchema,
  PlayTouchKeySchema,
  type PlayFooterMenuItem,
  type PlayTouchKey,
} from "../schemas/play-chrome";

const RAW_TOUCH_KEYS: readonly PlayTouchKey[] = [
  { id: "assist", letter: "A", label: "Assist" },
  { id: "chat", letter: "C", label: "Chat" },
  { id: "talk", letter: "P", label: "Push" },
  { id: "wallet", letter: "W", label: "Wallet" },
];

const RAW_FOOTER_MENU: readonly PlayFooterMenuItem[] = [
  { id: "debug", label: "Debug panel" },
];

export const PLAY_TOUCH_KEYS: readonly PlayTouchKey[] = RAW_TOUCH_KEYS.map(
  (key) => PlayTouchKeySchema.parse(key)
);

export const PLAY_FOOTER_MENU: readonly PlayFooterMenuItem[] = RAW_FOOTER_MENU.map(
  (item) => PlayFooterMenuItemSchema.parse(item)
);

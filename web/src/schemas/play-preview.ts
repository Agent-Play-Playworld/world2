import { z } from "zod";

export const IntercomAddressSchema = z
  .string()
  .regex(/^ap-intercom:\/\/.+/u);

export type IntercomAddress = z.infer<typeof IntercomAddressSchema>;

export const WalletAssetKindSchema = z.enum([
  "jpg",
  "png",
  "gif",
  "webp",
  "pdf",
]);

export type WalletAssetKind = z.infer<typeof WalletAssetKindSchema>;

export const WalletAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: WalletAssetKindSchema,
  previewUrl: z.string().min(1),
  caption: z.string().min(1),
});

export type WalletAsset = z.infer<typeof WalletAssetSchema>;

export const WalletPreviewSchema = z.object({
  balanceUsd: z.number(),
  powerUps: z.number().nonnegative(),
  assets: z.array(WalletAssetSchema),
});

export type WalletPreview = z.infer<typeof WalletPreviewSchema>;

export const GameStreakPreviewSchema = z.object({
  dayStreak: z.number().nonnegative(),
  bestStreak: z.number().nonnegative(),
  puEarnedToday: z.number().nonnegative(),
  puCap: z.number().positive(),
  gamesPlayedToday: z.number().nonnegative(),
  featuredGameId: z.string().min(1),
});

export type GameStreakPreview = z.infer<typeof GameStreakPreviewSchema>;

export const DebugAgentRowSchema = z.object({
  playerId: z.string().min(1),
  name: z.string().min(1),
  worldX: z.number(),
  worldY: z.number(),
});

export type DebugAgentRow = z.infer<typeof DebugAgentRowSchema>;

export const DebugStructureRowSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

export type DebugStructureRow = z.infer<typeof DebugStructureRowSchema>;

export const PlayDebugPreviewSchema = z.object({
  agents: z.array(DebugAgentRowSchema),
  structures: z.array(DebugStructureRowSchema),
  memberCount: z.number().nonnegative(),
});

export type PlayDebugPreview = z.infer<typeof PlayDebugPreviewSchema>;

export const PlayDebugSettingsSchema = z.object({
  worldGeographyEnabled: z.boolean(),
  showLayoutZones: z.boolean(),
  showFreeGrids: z.boolean(),
});

export type PlayDebugSettings = z.infer<typeof PlayDebugSettingsSchema>;

export const DebugSettingTabSchema = z.enum(["world", "roster", "system"]);

export type DebugSettingTab = z.infer<typeof DebugSettingTabSchema>;

export const PanelPlacementSchema = z.object({
  leftPx: z.number(),
  topPx: z.number(),
});

export type PanelPlacement = z.infer<typeof PanelPlacementSchema>;

export const PanelSizeSchema = z.object({
  widthPx: z.number().positive(),
  heightPx: z.number().positive(),
});

export type PanelSize = z.infer<typeof PanelSizeSchema>;

export const InvitePreviewSchema = z.object({
  code: z.string().min(1),
  link: z.string().min(1),
  rewardApu: z.string().min(1),
});

export type InvitePreview = z.infer<typeof InvitePreviewSchema>;

export const MessageReactionKindSchema = z.enum(["love", "thumbs_up"]);

export type MessageReactionKind = z.infer<typeof MessageReactionKindSchema>;

export const MessageReactionsSchema = z.object({
  love: z.array(z.string()),
  thumbs_up: z.array(z.string()),
});

export type MessageReactions = z.infer<typeof MessageReactionsSchema>;

export const WorldChatLineSchema = z.object({
  requestId: z.string().min(1),
  senderName: z.string().min(1),
  message: z.string().min(1),
  ts: z.string().min(1),
  fromSelf: z.boolean(),
  parentRequestId: z.string().nullable(),
  depth: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  reactions: MessageReactionsSchema,
});

export type WorldChatLine = z.infer<typeof WorldChatLineSchema>;

export const ChatContentPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  glyphs: z.array(z.string().min(1)).min(1),
});

export type ChatContentPack = z.infer<typeof ChatContentPackSchema>;

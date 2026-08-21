import { z } from "zod";
import { MessageReactionsSchema } from "./play-preview";

export const OccupancyPlayerWalletSchema = z.object({
  playerId: z.string().min(1),
  balanceUsd: z.number(),
  powerUps: z.number().nonnegative(),
  currency: z.literal("USD"),
  updatedAt: z.string().min(1),
});

export type OccupancyPlayerWallet = z.infer<typeof OccupancyPlayerWalletSchema>;

export const OccupancyPlayerWalletEnvelopeSchema = z.object({
  wallet: OccupancyPlayerWalletSchema,
});

export const OccupancyGamePerTitleStatsSchema = z.object({
  plays: z.number().int().nonnegative(),
  bestNetPu: z.number().int(),
});

export const OccupancyGameStatsSchema = z.object({
  dayStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  puEarnedToday: z.number().int().nonnegative(),
  puCapRemaining: z.number().int().nonnegative(),
  gamesPlayedToday: z.number().int().nonnegative(),
  featuredGameId: z.string(),
  firstGamePlayed: z.boolean(),
  perGame: z.record(z.string(), OccupancyGamePerTitleStatsSchema),
});

export type OccupancyGameStats = z.infer<typeof OccupancyGameStatsSchema>;

export const OccupancyGameStatsEnvelopeSchema = z.object({
  stats: OccupancyGameStatsSchema,
});

export const OccupancyWorldChatMessageSchema = z.object({
  seq: z.number().int(),
  requestId: z.string().min(1),
  fromPlayerId: z.string().min(1),
  message: z.string().min(1),
  ts: z.string().min(1),
  parentRequestId: z.string().min(1).optional(),
  depth: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  reactions: MessageReactionsSchema.optional(),
});

export type OccupancyWorldChatMessage = z.infer<
  typeof OccupancyWorldChatMessageSchema
>;

export const OccupancyWorldChatHistorySchema = z.object({
  messages: z.array(OccupancyWorldChatMessageSchema),
  hasMore: z.boolean(),
  totalCount: z.number().int().nonnegative(),
});

export type OccupancyWorldChatHistory = z.infer<
  typeof OccupancyWorldChatHistorySchema
>;

export const OccupancyWorldChatReactResultSchema = z.object({
  ok: z.literal(true),
  reactions: MessageReactionsSchema,
});

export type OccupancyWorldChatReactResult = z.infer<
  typeof OccupancyWorldChatReactResultSchema
>;

export const OccupancyIntercomEnvelopeSchema = z
  .object({
    result: z.unknown().optional(),
  })
  .passthrough();

export const OccupancyIntercomChatEventSchema = z.object({
  channelKey: z.literal("intercom:world:global"),
  requestId: z.string().min(1),
  fromPlayerId: z.string().min(1),
  message: z.string().min(1),
  ts: z.string().min(1),
  result: z.unknown().optional(),
});

export type OccupancyIntercomChatEvent = z.infer<
  typeof OccupancyIntercomChatEventSchema
>;

export const OccupancyPlayerAddedSchema = z.object({
  player: z.object({
    agentId: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    name: z.string().optional(),
  }),
});

export type OccupancyPlayerAdded = z.infer<typeof OccupancyPlayerAddedSchema>;

export const WORLD_CHAT_PUBLISH_OP = "worldChatPublish" as const;
export const WORLD_CHAT_HISTORY_OP = "worldChatHistory" as const;
export const WORLD_CHAT_REACT_OP = "worldChatReact" as const;
export const GET_GAME_STATS_OP = "getGameStats" as const;
export const WORLD_INTERCOM_SSE = "world:intercom" as const;
export const WORLD_PLAYER_ADDED_SSE = "world:player_added" as const;
export const WORLD_GLOBAL_CHAT_CHANNEL = "intercom:world:global" as const;

import {
  OccupancyIntercomChatEventSchema,
  OccupancyPlayerAddedSchema,
  OccupancyWorldChatMessageSchema,
  type OccupancyGameStats,
  type OccupancyPlayerWallet,
  type OccupancyWorldChatMessage,
} from "../schemas/occupancy-play";
import {
  ChatContentPackSchema,
  GameStreakPreviewSchema,
  IntercomAddressSchema,
  InvitePreviewSchema,
  MessageReactionsSchema,
  PanelPlacementSchema,
  PanelSizeSchema,
  PlayDebugPreviewSchema,
  PlayDebugSettingsSchema,
  WalletPreviewSchema,
  WorldChatLineSchema,
  type ChatContentPack,
  type GameStreakPreview,
  type InvitePreview,
  type MessageReactionKind,
  type MessageReactions,
  type PanelPlacement,
  type PanelSize,
  type PlayDebugPreview,
  type PlayDebugSettings,
  type WalletAsset,
  type WalletPreview,
  type WorldChatLine,
} from "../schemas/play-preview";
import { WORLD2_PAGE_ORIGIN } from "./origins";

export const DAILY_GAME_PU_CAP = 100;
export const REFERRAL_REWARD_APU_COPY = "+25 APU";
export const P2A_HELP_HREF = "https://agent-play.com/agent-play-p2a-implementation";

const APW_NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const APU_NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const formatApwBalance = (balanceUsd: number): string => {
  if (!Number.isFinite(balanceUsd)) {
    return "$—";
  }
  const rounded = Math.round(balanceUsd * 100) / 100;
  return `$${APW_NUMBER_FORMAT.format(rounded)}`;
};

export const formatApuCount = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) {
    return "0";
  }
  return APU_NUMBER_FORMAT.format(Math.floor(n));
};

export const intercomAddressForNode = (nodeId: string): string => {
  return IntercomAddressSchema.parse(`ap-intercom://${nodeId}`);
};

export const isValidIntercomAddress = (value: string | null): boolean => {
  if (value === null) {
    return false;
  }
  return IntercomAddressSchema.safeParse(value).success;
};

export const defaultWalletPreview = (): WalletPreview => {
  return WalletPreviewSchema.parse({
    balanceUsd: 0,
    powerUps: 0,
    assets: defaultWalletAssets(),
  });
};

export const defaultGameStreakPreview = (): GameStreakPreview => {
  return GameStreakPreviewSchema.parse({
    dayStreak: 0,
    bestStreak: 0,
    puEarnedToday: 0,
    puCap: DAILY_GAME_PU_CAP,
    gamesPlayedToday: 0,
    featuredGameId: "daily-rotator",
  });
};

export const walletPreviewFromOccupancy = (
  wallet: OccupancyPlayerWallet
): WalletPreview => {
  return WalletPreviewSchema.parse({
    balanceUsd: wallet.balanceUsd,
    powerUps: wallet.powerUps,
    assets: defaultWalletAssets(),
  });
};

export const gameStreakFromOccupancyStats = (
  stats: OccupancyGameStats
): GameStreakPreview => {
  const computedCap = stats.puEarnedToday + stats.puCapRemaining;
  const featured =
    stats.featuredGameId.trim().length > 0
      ? stats.featuredGameId.trim()
      : "daily-rotator";
  return GameStreakPreviewSchema.parse({
    dayStreak: stats.dayStreak,
    bestStreak: stats.bestStreak,
    puEarnedToday: stats.puEarnedToday,
    puCap: computedCap > 0 ? computedCap : DAILY_GAME_PU_CAP,
    gamesPlayedToday: stats.gamesPlayedToday,
    featuredGameId: featured,
  });
};

export const occupancyMessageToLine = (options: {
  message: OccupancyWorldChatMessage;
  viewerId: string;
}): WorldChatLine => {
  const fromSelf = options.message.fromPlayerId === options.viewerId;
  const depth = options.message.depth ?? 0;
  return WorldChatLineSchema.parse({
    requestId: options.message.requestId,
    senderName: fromSelf ? WORLD_CHAT_SELF_NAME : options.message.fromPlayerId,
    message: options.message.message,
    ts: options.message.ts,
    fromSelf,
    parentRequestId: options.message.parentRequestId ?? null,
    depth: depth === 1 || depth === 2 ? depth : 0,
    reactions: options.message.reactions ?? createEmptyMessageReactions(),
  });
};

export const worldChatLinesFromHistory = (options: {
  messages: readonly OccupancyWorldChatMessage[];
  viewerId: string;
}): WorldChatLine[] => {
  return [...options.messages]
    .sort((left, right) => left.seq - right.seq)
    .map((message) =>
      occupancyMessageToLine({ message, viewerId: options.viewerId })
    );
};

export const mergeWorldChatHistory = (options: {
  lines: readonly WorldChatLine[];
  incoming: readonly WorldChatLine[];
}): WorldChatLine[] => {
  const byId = new Map<string, WorldChatLine>();
  for (const line of options.lines) {
    if (line.requestId !== WORLD_CHAT_STREET_REQUEST_ID) {
      byId.set(line.requestId, line);
    }
  }
  for (const line of options.incoming) {
    byId.set(line.requestId, line);
  }
  return [...byId.values()];
};

export const occupancyChatLineFromIntercomEvent = (options: {
  event: unknown;
  viewerId: string;
}): WorldChatLine | null => {
  const event = OccupancyIntercomChatEventSchema.safeParse(options.event);
  if (!event.success) {
    return null;
  }
  const result = event.data.result;
  const extras =
    typeof result === "object" && result !== null && !Array.isArray(result)
      ? result
      : {};
  const message = OccupancyWorldChatMessageSchema.safeParse({
    seq: 0,
    ...extras,
    requestId: event.data.requestId,
    fromPlayerId: event.data.fromPlayerId,
    message: event.data.message.trim(),
    ts: event.data.ts,
  });
  if (!message.success) {
    return null;
  }
  return occupancyMessageToLine({
    message: message.data,
    viewerId: options.viewerId,
  });
};

export const occupancyJoinFromPlayerAdded = (
  data: unknown
): { playerId: string; displayName?: string } | null => {
  const parsed = OccupancyPlayerAddedSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  const playerId = parsed.data.player.agentId ?? parsed.data.player.nodeId ?? "";
  if (playerId.length === 0) {
    return null;
  }
  const name = parsed.data.player.name?.trim() ?? "";
  if (name.length === 0) {
    return { playerId };
  }
  return { playerId, displayName: name };
};

export const applyWorldChatReactions = (options: {
  lines: readonly WorldChatLine[];
  requestId: string;
  reactions: MessageReactions;
}): readonly WorldChatLine[] => {
  return options.lines.map((line) => {
    if (line.requestId !== options.requestId) {
      return line;
    }
    return { ...line, reactions: options.reactions };
  });
};

export const PLAY_DEBUG_SETTINGS_STORAGE_KEY = "world2:play-debug-settings";

export const playDebugSettingsStorageKey = (nodeId?: string): string => {
  if (nodeId === undefined || nodeId.trim().length === 0) {
    return PLAY_DEBUG_SETTINGS_STORAGE_KEY;
  }
  return `${PLAY_DEBUG_SETTINGS_STORAGE_KEY}:${nodeId.trim()}`;
};

export const loadPlayDebugSettings = (options: {
  storage?: Pick<Storage, "getItem">;
  nodeId?: string;
} = {}): PlayDebugSettings => {
  const storage =
    options.storage ??
    (typeof localStorage === "undefined" ? undefined : localStorage);
  if (storage === undefined) {
    return defaultPlayDebugSettings();
  }
  const raw = storage.getItem(playDebugSettingsStorageKey(options.nodeId));
  if (raw === null || raw.length === 0) {
    return defaultPlayDebugSettings();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return PlayDebugSettingsSchema.parse(parsed);
  } catch {
    return defaultPlayDebugSettings();
  }
};

export const savePlayDebugSettings = (options: {
  settings: PlayDebugSettings;
  storage?: Pick<Storage, "setItem">;
  nodeId?: string;
}): void => {
  const storage =
    options.storage ??
    (typeof localStorage === "undefined" ? undefined : localStorage);
  if (storage === undefined) {
    return;
  }
  storage.setItem(
    playDebugSettingsStorageKey(options.nodeId),
    JSON.stringify(options.settings)
  );
};

export const defaultInvitePreview = (nodeId: string): InvitePreview => {
  const code = nodeId.slice(0, 8).toUpperCase();
  return InvitePreviewSchema.parse({
    code,
    link: `${WORLD2_PAGE_ORIGIN}/?rc=${code}`,
    rewardApu: REFERRAL_REWARD_APU_COPY,
  });
};

const readNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const readString = (value: unknown, fallback: string): string => {
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

export const parsePlayDebugSnapshot = (snapshot: unknown): PlayDebugPreview => {
  const empty = { agents: [], structures: [], memberCount: 0 };
  if (typeof snapshot !== "object" || snapshot === null) {
    return PlayDebugPreviewSchema.parse(empty);
  }
  const worldMap = (snapshot as { worldMap?: unknown }).worldMap;
  if (typeof worldMap !== "object" || worldMap === null) {
    return PlayDebugPreviewSchema.parse(empty);
  }
  const occupants = (worldMap as { occupants?: unknown }).occupants;
  if (!Array.isArray(occupants)) {
    return PlayDebugPreviewSchema.parse(empty);
  }

  const agents: PlayDebugPreview["agents"] = [];
  const structures: PlayDebugPreview["structures"] = [];
  let memberCount = 0;
  for (const row of occupants) {
    if (typeof row !== "object" || row === null) {
      continue;
    }
    const occupant = row as Record<string, unknown>;
    const kind = readString(occupant.kind, "");
    if (kind === "agent") {
      memberCount += 1;
      agents.push({
        playerId: readString(occupant.agentId ?? occupant.id, "agent"),
        name: readString(occupant.name, "Agent"),
        worldX: readNumber(occupant.x, 0),
        worldY: readNumber(occupant.y, 0),
      });
      continue;
    }
    if (kind === "human") {
      memberCount += 1;
      continue;
    }
    if (kind === "structure") {
      structures.push({
        id: readString(occupant.id, "structure"),
        kind: readString(occupant.gameId, "") === "" ? "space" : "arcade",
        x: readNumber(occupant.x, 0),
        y: readNumber(occupant.y, 0),
      });
    }
  }
  return PlayDebugPreviewSchema.parse({ agents, structures, memberCount });
};

export const clampPanelPlacement = (options: {
  leftPx: number;
  topPx: number;
  panelWidth: number;
  panelHeight: number;
  boundsWidth: number;
  boundsHeight: number;
}): PanelPlacement => {
  const finite = (value: number): number => {
    return Number.isFinite(value) ? value : 0;
  };
  const maxLeft = Math.max(0, finite(options.boundsWidth) - finite(options.panelWidth));
  const maxTop = Math.max(0, finite(options.boundsHeight) - finite(options.panelHeight));
  return PanelPlacementSchema.parse({
    leftPx: Math.min(Math.max(0, finite(options.leftPx)), maxLeft),
    topPx: Math.min(Math.max(0, finite(options.topPx)), maxTop),
  });
};

export const WORLD_CHAT_SELF_NAME = "You";
export const WORLD_CHAT_STREET_NAME = "The street";
export const WORLD_CHAT_STREET_REQUEST_ID = "street-holding";
export const WORLD_CHAT_EMPTY_HEADLINE = "The street is holding its breath.";
export const WORLD_CHAT_FLAP_WORDS = ["THE", "STREET", "IS", "LISTENING"] as const;
export const WORLD_CHAT_COMPOSE_PLACEHOLDER = "Say something to everyone...";
export const GEOGRAPHY_MEMBER_CAP = 100;
export const COLLAPSED_PANEL_HEIGHT_PX = 52;
export const PANEL_SIZE_EASE_MS = 360;

export const nextExpandedPanelHeightPx = (options: {
  measuredOpenPx: number;
  storedOpenPx: number | null;
  collapsedPx?: number;
  userSized?: boolean;
}): number | null => {
  const collapsedPx = options.collapsedPx ?? COLLAPSED_PANEL_HEIGHT_PX;
  const usable = (value: number | null): number | null => {
    if (value === null || !Number.isFinite(value) || value <= collapsedPx) {
      return null;
    }
    return value;
  };
  if (options.userSized === true) {
    return usable(options.storedOpenPx);
  }
  return usable(options.measuredOpenPx) ?? usable(options.storedOpenPx);
};

export const shouldReleaseExpandedPanelHeight = (options: {
  userSized: boolean;
}): boolean => {
  return options.userSized !== true;
};

export const formatCompactCount = (count: number): string => {
  if (!Number.isFinite(count) || count < 0) {
    return "0";
  }
  if (count < 1000) {
    return `${Math.floor(count)}`;
  }
  if (count < 1_000_000) {
    const value = count / 1000;
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}K`;
  }
  return `${(count / 1_000_000).toFixed(1)}M`;
};

export const listeningNamesFromSnapshot = (snapshot: unknown): readonly string[] => {
  return parsePlayDebugSnapshot(snapshot).agents.map((agent) => agent.name);
};

export const formatGeographyMembers = (memberCount: number): string => {
  const safe = Number.isFinite(memberCount) && memberCount > 0 ? Math.floor(memberCount) : 0;
  return `members ${String(safe)}/${String(GEOGRAPHY_MEMBER_CAP)}`;
};

export const DEBUG_SETTING_TABS = ["world", "roster", "system"] as const;

export const defaultPlayDebugSettings = (): PlayDebugSettings => {
  return PlayDebugSettingsSchema.parse({
    worldGeographyEnabled: false,
    showLayoutZones: false,
    showFreeGrids: false,
  });
};

export const setPlayDebugSetting = (options: {
  settings: PlayDebugSettings;
  key: keyof PlayDebugSettings;
  enabled: boolean;
}): PlayDebugSettings => {
  return PlayDebugSettingsSchema.parse({
    ...options.settings,
    [options.key]: options.enabled,
  });
};

export const formatDebugSwitch = (enabled: boolean): "On" | "Off" => {
  return enabled ? "On" : "Off";
};

export const createStreetPreviewLine = (): WorldChatLine => {
  return WorldChatLineSchema.parse({
    requestId: WORLD_CHAT_STREET_REQUEST_ID,
    senderName: WORLD_CHAT_STREET_NAME,
    message: WORLD_CHAT_EMPTY_HEADLINE,
    ts: "2026-08-21T00:00:00.000Z",
    fromSelf: false,
    parentRequestId: null,
    depth: 0,
    reactions: createEmptyMessageReactions(),
  });
};

export const createEmptyMessageReactions = (): MessageReactions => {
  return MessageReactionsSchema.parse({ love: [], thumbs_up: [] });
};

export const MAX_REPLY_DEPTH = 2;

export const canReplyToWorldChatDepth = (depth: number): boolean => {
  return Number.isInteger(depth) && depth >= 0 && depth < MAX_REPLY_DEPTH;
};

export const buildWorldChatLink = (options: {
  requestId: string;
  baseUrl: string;
}): string => {
  const url = new URL(options.baseUrl);
  url.searchParams.set("message", options.requestId);
  return url.toString();
};

export const reactToWorldChatLine = (options: {
  lines: readonly WorldChatLine[];
  requestId: string;
  playerId: string;
  kind: MessageReactionKind;
}): readonly WorldChatLine[] => {
  const playerId = options.playerId.trim();
  if (playerId.length === 0) {
    return options.lines;
  }
  return options.lines.map((line) => {
    if (line.requestId !== options.requestId) {
      return line;
    }
    const already = line.reactions[options.kind].includes(playerId);
    const cleared: MessageReactions = {
      love: line.reactions.love.filter((id) => id !== playerId),
      thumbs_up: line.reactions.thumbs_up.filter((id) => id !== playerId),
    };
    if (already) {
      return { ...line, reactions: cleared };
    }
    return {
      ...line,
      reactions: {
        ...cleared,
        [options.kind]: [...cleared[options.kind], playerId],
      },
    };
  });
};

export const createWorldChatLine = (options: {
  message: string;
  senderName?: string;
  now?: Date;
  parent?: WorldChatLine;
  requestId?: string;
  fromSelf?: boolean;
}): WorldChatLine => {
  const trimmed = options.message.trim();
  const senderName = options.senderName ?? WORLD_CHAT_SELF_NAME;
  const now = options.now ?? new Date();
  const parent = options.parent;
  const depth =
    parent === undefined ? 0 : Math.min(parent.depth + 1, MAX_REPLY_DEPTH);
  return WorldChatLineSchema.parse({
    requestId:
      options.requestId ??
      `local-${now.toISOString()}-${senderName}-${trimmed.slice(0, 8)}`,
    senderName,
    message: trimmed,
    ts: now.toISOString(),
    fromSelf: options.fromSelf ?? senderName === WORLD_CHAT_SELF_NAME,
    parentRequestId: parent === undefined ? null : parent.requestId,
    depth: depth === 1 || depth === 2 ? depth : 0,
    reactions: createEmptyMessageReactions(),
  });
};

export const appendWorldChatLine = (options: {
  lines: readonly WorldChatLine[];
  message: string;
  senderName?: string;
  now?: Date;
  parent?: WorldChatLine;
  requestId?: string;
  fromSelf?: boolean;
}): readonly WorldChatLine[] => {
  const trimmed = options.message.trim();
  if (trimmed.length === 0) {
    return options.lines;
  }
  if (options.parent !== undefined && !canReplyToWorldChatDepth(options.parent.depth)) {
    return options.lines;
  }
  return [
    ...options.lines,
    createWorldChatLine({
      message: trimmed,
      ...(options.senderName === undefined ? {} : { senderName: options.senderName }),
      ...(options.now === undefined ? {} : { now: options.now }),
      ...(options.parent === undefined ? {} : { parent: options.parent }),
      ...(options.requestId === undefined ? {} : { requestId: options.requestId }),
      ...(options.fromSelf === undefined ? {} : { fromSelf: options.fromSelf }),
    }),
  ];
};

export const clampPanelSize = (options: {
  widthPx: number;
  heightPx: number;
  minWidthPx: number;
  minHeightPx: number;
  maxWidthPx: number;
  maxHeightPx: number;
}): PanelSize => {
  const finite = (value: number, fallback: number): number => {
    return Number.isFinite(value) ? value : fallback;
  };
  return PanelSizeSchema.parse({
    widthPx: Math.min(
      Math.max(finite(options.widthPx, options.minWidthPx), options.minWidthPx),
      options.maxWidthPx
    ),
    heightPx: Math.min(
      Math.max(finite(options.heightPx, options.minHeightPx), options.minHeightPx),
      options.maxHeightPx
    ),
  });
};

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const TINY_WEBP =
  "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
const TINY_JPG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/2gAIAQEAAT8Af//Z";
const TINY_PDF =
  "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDAvS2lkc1tdPj4KZW5kb2JqCnhyZWYKMCAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjIgMDAwMDAgbiAKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgMz4+CnN0YXJ0eHJlZgoxMTcKJSVFT0Y=";

export const defaultWalletAssets = (): readonly WalletAsset[] => {
  return WalletPreviewSchema.shape.assets.parse([
    {
      id: "deed-png",
      name: "House deed scan",
      kind: "png",
      previewUrl: TINY_PNG,
      caption: "Peterson St. lot paper",
    },
    {
      id: "street-jpg",
      name: "Street polaroid",
      kind: "jpg",
      previewUrl: TINY_JPG,
      caption: "Maple Ave morning",
    },
    {
      id: "neon-gif",
      name: "Arcade loop",
      kind: "gif",
      previewUrl: TINY_GIF,
      caption: "Cabinet attract mode",
    },
    {
      id: "foil-webp",
      name: "Foil sticker",
      kind: "webp",
      previewUrl: TINY_WEBP,
      caption: "APU collector wrap",
    },
    {
      id: "title-pdf",
      name: "Title packet",
      kind: "pdf",
      previewUrl: TINY_PDF,
      caption: "Citizenship papers reprint",
    },
  ]);
};

export const isImageWalletAsset = (asset: WalletAsset): boolean => {
  return asset.kind !== "pdf";
};

export const powerUpsToNextBundle = (powerUps: number): number | null => {
  const nextCost = 10;
  if (powerUps >= nextCost) {
    return null;
  }
  return nextCost - Math.floor(powerUps);
};

export const STREET_STICKER_PACK_ID = "street-stickers";
export const PLAZA_STICKER_PACK_ID = "plaza-stickers";

export const STREET_STICKER_PACK = ChatContentPackSchema.parse({
  id: STREET_STICKER_PACK_ID,
  name: "Street stickers",
  glyphs: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "😉",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😋",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤔",
    "🤨",
    "😐",
    "😑",
    "😶",
    "🙄",
    "😏",
    "😣",
    "😥",
    "😮",
    "🤐",
    "😯",
    "😪",
    "😫",
    "🥱",
    "😴",
    "😌",
    "😛",
    "👍",
    "👎",
    "👏",
    "🙌",
    "🤝",
    "🙏",
    "💪",
    "🔥",
    "✨",
    "💯",
  ],
});

export const PLAZA_STICKER_PACK = ChatContentPackSchema.parse({
  id: PLAZA_STICKER_PACK_ID,
  name: "Plaza stickers",
  glyphs: ["🌟", "🌙", "☀️", "🌧️", "🏠", "🗺️"],
});

export const defaultInstalledContentPacks = (): readonly ChatContentPack[] => {
  return [STREET_STICKER_PACK];
};

export const installChatContentPack = (options: {
  installed: readonly ChatContentPack[];
  pack: ChatContentPack;
}): readonly ChatContentPack[] => {
  if (options.installed.some((pack) => pack.id === options.pack.id)) {
    return options.installed;
  }
  return [...options.installed, ChatContentPackSchema.parse(options.pack)];
};

export const insertChatGlyph = (options: {
  draft: string;
  glyph: string;
}): string => {
  const glyph = options.glyph.trim();
  if (glyph.length === 0) {
    return options.draft;
  }
  return `${options.draft}${glyph}`;
};

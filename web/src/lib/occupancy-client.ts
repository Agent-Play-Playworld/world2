import {
  GET_GAME_STATS_OP,
  OccupancyGameStatsEnvelopeSchema,
  OccupancyPlayerWalletEnvelopeSchema,
  OccupancyWorldChatHistorySchema,
  OccupancyWorldChatReactResultSchema,
  WORLD_CHAT_HISTORY_OP,
  WORLD_CHAT_PUBLISH_OP,
  WORLD_CHAT_REACT_OP,
  type OccupancyGameStats,
  type OccupancyPlayerWallet,
  type OccupancyWorldChatHistory,
} from "../schemas/occupancy-play";
import type { MessageReactionKind, MessageReactions } from "../schemas/play-preview";
import { occupancyApiBase } from "./occupancy-origin";

export type OccupancyFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type OccupancyClientOptions = {
  origin: string;
  fetchFn?: OccupancyFetch | undefined;
};

const request = (options: OccupancyClientOptions): OccupancyFetch => {
  return options.fetchFn ?? fetch;
};

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(text.length > 0 ? text : "Occupancy response was empty.");
  }
};

export const createOccupancySession = async (
  options: OccupancyClientOptions
): Promise<string> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/session`,
    {
      cache: "no-store",
      credentials: "omit",
    }
  );
  if (!response.ok) {
    throw new Error("Could not open an occupancy session.");
  }
  const json = await readJson(response);
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { sid?: unknown }).sid !== "string" ||
    (json as { sid: string }).sid.trim().length === 0
  ) {
    throw new Error("Occupancy session did not return a sid.");
  }
  return (json as { sid: string }).sid.trim();
};

export const loadWorldSnapshot = async (
  options: OccupancyClientOptions
): Promise<unknown> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/sdk/rpc`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ op: "getWorldSnapshot", payload: {} }),
    }
  );
  if (!response.ok) {
    throw new Error("Could not load world resources.");
  }
  const json = await readJson(response);
  if (typeof json === "object" && json !== null && "snapshot" in json) {
    return (json as { snapshot: unknown }).snapshot;
  }
  return json;
};

export const loadOccupancyRootKey = async (
  options: OccupancyClientOptions
): Promise<string> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/bootstrap`,
    { cache: "no-store", credentials: "omit" }
  );
  if (!response.ok) {
    throw new Error("Could not load the occupancy root key.");
  }
  const json = await readJson(response);
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { rootKey?: unknown }).rootKey !== "string"
  ) {
    throw new Error("Occupancy bootstrap did not return a root key.");
  }
  return (json as { rootKey: string }).rootKey.trim().toLowerCase();
};

type CreateHumanNodeOptions = OccupancyClientOptions & {
  sid: string;
  nodeId: string;
  passwHash: string;
};

export const createHumanNode = async (
  options: CreateHumanNodeOptions
): Promise<{ nodeId: string }> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/sdk/rpc?sid=${encodeURIComponent(options.sid)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        op: "createHumanNode",
        payload: {
          consent: true,
          nodeId: options.nodeId,
          passwHash: options.passwHash,
        },
      }),
    }
  );
  const json = await readJson(response);
  if (!response.ok) {
    throw new Error(
      typeof json === "string" ? json : "createHumanNode failed."
    );
  }
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { nodeId?: unknown }).nodeId !== "string"
  ) {
    throw new Error("invalid createHumanNode response");
  }
  return { nodeId: (json as { nodeId: string }).nodeId };
};

type ValidateMainNodeOptions = OccupancyClientOptions & {
  nodeId: string;
  passwHash: string;
};

export const validateMainNode = async (
  options: ValidateMainNodeOptions
): Promise<{ ok: true; nodeKind?: string } | { ok: false; reason: string }> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/nodes/validate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-node-id": options.nodeId,
        "x-node-passw": options.passwHash,
      },
      credentials: "omit",
      body: JSON.stringify({ nodeId: options.nodeId }),
    }
  );
  const json = await readJson(response);
  if (
    typeof json !== "object" ||
    json === null ||
    (json as { ok?: unknown }).ok !== true
  ) {
    const reason =
      typeof json === "object" &&
      json !== null &&
      typeof (json as { reason?: unknown }).reason === "string"
        ? (json as { reason: string }).reason
        : "Main node validation failed.";
    return { ok: false, reason };
  }
  const nodeKind = (json as { nodeKind?: unknown }).nodeKind;
  return {
    ok: true,
    ...(typeof nodeKind === "string" ? { nodeKind } : {}),
  };
};

type OccupancyRpcOptions = OccupancyClientOptions & {
  sid: string;
  op: string;
  payload: unknown;
};

const postOccupancyRpc = async (
  options: OccupancyRpcOptions
): Promise<unknown> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/sdk/rpc?sid=${encodeURIComponent(options.sid)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        op: options.op,
        payload: options.payload,
      }),
    }
  );
  const json = await readJson(response);
  if (!response.ok) {
    throw new Error(
      typeof json === "string" ? json : `${options.op} failed.`
    );
  }
  return json;
};

type PlayerWalletOptions = OccupancyClientOptions & {
  playerId: string;
  sid: string;
};

export const fetchPlayerWallet = async (
  options: PlayerWalletOptions
): Promise<OccupancyPlayerWallet> => {
  const response = await request(options)(
    `${occupancyApiBase(options.origin)}/players/${encodeURIComponent(options.playerId)}/wallet?sid=${encodeURIComponent(options.sid)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
    }
  );
  if (!response.ok) {
    throw new Error("Could not load the player wallet.");
  }
  const json = await readJson(response);
  return OccupancyPlayerWalletEnvelopeSchema.parse(json).wallet;
};

type GameStatsOptions = OccupancyClientOptions & {
  playerId: string;
  sid: string;
};

export const fetchGameStats = async (
  options: GameStatsOptions
): Promise<OccupancyGameStats> => {
  const json = await postOccupancyRpc({
    origin: options.origin,
    fetchFn: options.fetchFn,
    sid: options.sid,
    op: GET_GAME_STATS_OP,
    payload: { playerId: options.playerId },
  });
  return OccupancyGameStatsEnvelopeSchema.parse(json).stats;
};

type WorldChatHistoryOptions = OccupancyClientOptions & {
  sid: string;
  limit?: number;
  beforeSeq?: number;
};

export const loadWorldChatHistory = async (
  options: WorldChatHistoryOptions
): Promise<OccupancyWorldChatHistory> => {
  const json = await postOccupancyRpc({
    origin: options.origin,
    fetchFn: options.fetchFn,
    sid: options.sid,
    op: WORLD_CHAT_HISTORY_OP,
    payload: {
      limit: options.limit ?? 100,
      ...(options.beforeSeq === undefined ? {} : { beforeSeq: options.beforeSeq }),
    },
  });
  return OccupancyWorldChatHistorySchema.parse(json);
};

type PublishWorldChatOptions = OccupancyClientOptions & {
  sid: string;
  requestId: string;
  mainNodeId: string;
  fromPlayerId: string;
  message: string;
  parentRequestId?: string;
};

export const publishWorldChat = async (
  options: PublishWorldChatOptions
): Promise<void> => {
  await postOccupancyRpc({
    origin: options.origin,
    fetchFn: options.fetchFn,
    sid: options.sid,
    op: WORLD_CHAT_PUBLISH_OP,
    payload: {
      requestId: options.requestId,
      mainNodeId: options.mainNodeId,
      fromPlayerId: options.fromPlayerId,
      message: options.message,
      ...(options.parentRequestId === undefined
        ? {}
        : { parentRequestId: options.parentRequestId }),
    },
  });
};

type ReactWorldChatOptions = OccupancyClientOptions & {
  sid: string;
  requestId: string;
  mainNodeId: string;
  fromPlayerId: string;
  kind: MessageReactionKind;
  action: "set" | "cancel";
};

export const reactWorldChat = async (
  options: ReactWorldChatOptions
): Promise<MessageReactions> => {
  const json = await postOccupancyRpc({
    origin: options.origin,
    fetchFn: options.fetchFn,
    sid: options.sid,
    op: WORLD_CHAT_REACT_OP,
    payload: {
      requestId: options.requestId,
      mainNodeId: options.mainNodeId,
      fromPlayerId: options.fromPlayerId,
      kind: options.kind,
      action: options.action,
    },
  });
  return OccupancyWorldChatReactResultSchema.parse(json).reactions;
};

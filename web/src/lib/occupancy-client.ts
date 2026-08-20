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

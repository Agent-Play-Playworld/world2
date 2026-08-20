import { OccupancyServerUrlSchema } from "../schemas/occupancy-server-url";
import { CANONICAL_OCCUPANCY_ORIGIN } from "./origins";

export type CanonicalizeServerUrlResult =
  | { ok: true; serverUrl: typeof CANONICAL_OCCUPANCY_ORIGIN }
  | { ok: false; reason: string };

const OCCUPANCY_ALIAS_HOSTS = new Set([
  "agent-play.com",
  "playworld.world",
  "world1.v0peer.org",
]);

const hostnameWithoutWww = (hostname: string): string => {
  return hostname.toLowerCase().replace(/^www\./, "");
};

export const canonicalizeOccupancyServerUrl = (
  rawUrl: string
): CanonicalizeServerUrlResult => {
  const parsedUrl = OccupancyServerUrlSchema.safeParse(rawUrl.trim());
  if (!parsedUrl.success) {
    return {
      ok: false,
      reason: "credentials.json serverUrl is not a valid URL.",
    };
  }

  try {
    const parsed = new URL(parsedUrl.data);
    const hostname = hostnameWithoutWww(parsed.hostname);

    if (
      /^world\d+\.v0peer\.org$/u.test(hostname) &&
      hostname !== "world1.v0peer.org"
    ) {
      return {
        ok: false,
        reason:
          "world2 and worldN are page origins, never occupancy serverUrl values.",
      };
    }

    if (!OCCUPANCY_ALIAS_HOSTS.has(hostname)) {
      return {
        ok: false,
        reason: `credentials.json is for a different server (${rawUrl.trim()}).`,
      };
    }

    return { ok: true, serverUrl: CANONICAL_OCCUPANCY_ORIGIN };
  } catch {
    return {
      ok: false,
      reason: "credentials.json serverUrl is not a valid URL.",
    };
  }
};

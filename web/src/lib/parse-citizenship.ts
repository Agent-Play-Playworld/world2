import {
  AcceptedCitizenshipSchema,
  CitizenshipCredentialSchema,
  type AcceptedCitizenship,
} from "../schemas/citizenship";
import { canonicalizeOccupancyServerUrl } from "./canonicalize-server-url";

export type ParseCitizenshipResult =
  | { ok: true; citizenship: AcceptedCitizenship }
  | { ok: false; reason: string };

type ParseCitizenshipOptions = {
  occupancyOrigin?: string | undefined;
};

export const parseCitizenshipCredential = (
  json: unknown,
  options: ParseCitizenshipOptions = {}
): ParseCitizenshipResult => {
  const parsed = CitizenshipCredentialSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "Upload a credentials.json citizen file.",
    };
  }

  const server = canonicalizeOccupancyServerUrl(parsed.data.serverUrl, {
    occupancyOrigin: options.occupancyOrigin,
  });
  if (!server.ok) {
    return { ok: false, reason: server.reason };
  }

  const citizenship = AcceptedCitizenshipSchema.parse({
    nodeId: parsed.data.nodeId.trim(),
    serverUrl: server.serverUrl,
  });

  return { ok: true, citizenship };
};

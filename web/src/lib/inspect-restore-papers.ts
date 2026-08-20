import { CitizenshipCredentialSchema } from "../schemas/citizenship";
import {
  RestorePapersPreviewSchema,
  type RestorePapersPreview,
} from "../schemas/restore-papers";
import { parseCitizenshipCredential } from "./parse-citizenship";

export type InspectRestorePapersResult =
  | { ok: true; preview: RestorePapersPreview; passw: string }
  | { ok: false; reason: string };

type InspectRestorePapersOptions = {
  text: string;
  fileName: string;
  occupancyOrigin?: string | undefined;
};

export const inspectRestorePapers = (
  options: InspectRestorePapersOptions
): InspectRestorePapersResult => {
  let json: unknown;
  try {
    json = JSON.parse(options.text);
  } catch {
    return {
      ok: false,
      reason: "That file is not readable JSON. Use credentials.json.",
    };
  }

  const parsed = parseCitizenshipCredential(json, {
    occupancyOrigin: options.occupancyOrigin,
  });
  if (!parsed.ok) {
    return parsed;
  }

  const credential = CitizenshipCredentialSchema.parse(json);
  return {
    ok: true,
    preview: RestorePapersPreviewSchema.parse({
      fileName: options.fileName,
      nodeId: parsed.citizenship.nodeId,
      serverUrl: parsed.citizenship.serverUrl,
    }),
    passw: credential.passw,
  };
};

export const pickRestoreFile = (
  files: ArrayLike<File> | null | undefined
): File | null => {
  if (files === undefined || files === null || files.length === 0) {
    return null;
  }
  const list = Array.from(files);
  const namedJson = list.find((file) => file.name.toLowerCase().endsWith(".json"));
  return namedJson ?? list[0] ?? null;
};

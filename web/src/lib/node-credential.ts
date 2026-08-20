import { scrypt } from "@noble/hashes/scrypt.js";
import { sha256 } from "@noble/hashes/sha2.js";

const utf8 = new TextEncoder();

const NODE_ID_SCRYPT = {
  N: 65536,
  r: 8,
  p: 1,
  maxmem: 128 * 1024 * 1024,
  dkLen: 32,
} as const;

const PASSPHRASE_WORDS = [
  "amber",
  "angle",
  "apple",
  "arch",
  "atlas",
  "aura",
  "autumn",
  "bamboo",
  "beacon",
  "birch",
  "cedar",
  "cloud",
  "copper",
  "coral",
  "dawn",
  "ember",
  "field",
  "flint",
  "grove",
  "harbor",
  "ivory",
  "jade",
  "lagoon",
  "maple",
  "meadow",
  "nickel",
  "olive",
  "pearl",
  "quartz",
  "river",
  "slate",
  "willow",
] as const;

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const normalizeNodePassphrase = (passw: string): string => {
  return passw.trim().replace(/\s+/g, " ");
};

export const hashNodePassword = async (password: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    utf8.encode(normalizeNodePassphrase(password))
  );
  return bytesToHex(new Uint8Array(digest));
};

export const deriveNodeId = async (options: {
  passwHash: string;
  rootKey: string;
}): Promise<string> => {
  const normalizedRootKey = options.rootKey.trim().toLowerCase();
  const derived = scrypt(
    utf8.encode(options.passwHash),
    sha256(utf8.encode(`agent-play:node-id:v1:${normalizedRootKey}`)),
    NODE_ID_SCRYPT
  );
  return bytesToHex(derived);
};

export type NodeCredentialMaterial = {
  phrase: string;
  passwHash: string;
  nodeId: string;
};

export type DeriveNodeCredential = (options: {
  phrase: string;
  rootKey: string;
}) => Promise<NodeCredentialMaterial>;

export const credentialFromPhrase: DeriveNodeCredential = async (options) => {
  const phrase = normalizeNodePassphrase(options.phrase);
  const passwHash = await hashNodePassword(phrase);
  const nodeId = await deriveNodeId({
    passwHash,
    rootKey: options.rootKey,
  });
  return { phrase, passwHash, nodeId };
};

export const generateNodePassphrase = (wordCount = 10): string => {
  const bytes = new Uint8Array(wordCount);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => PASSPHRASE_WORDS[byte % PASSPHRASE_WORDS.length] ?? "amber"
  ).join(" ");
};

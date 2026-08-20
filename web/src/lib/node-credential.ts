import { scrypt } from "@noble/hashes/scrypt.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { PASSPHRASE_WORDS } from "./passphrase-words";

export { PASSPHRASE_WORDS } from "./passphrase-words";

const utf8 = new TextEncoder();

const NODE_ID_SCRYPT = {
  N: 65536,
  r: 8,
  p: 1,
  maxmem: 128 * 1024 * 1024,
  dkLen: 32,
} as const;

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

const pickPassphraseWord = (): string => {
  const span = 0x100000000;
  const length = PASSPHRASE_WORDS.length;
  const limit = span - (span % length);
  const bytes = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(bytes);
    const value = bytes[0] ?? 0;
    if (value < limit) {
      return PASSPHRASE_WORDS[value % length] ?? "amber";
    }
  }
};

export const generateNodePassphrase = (wordCount = 10): string => {
  return Array.from({ length: wordCount }, () => pickPassphraseWord()).join(" ");
};

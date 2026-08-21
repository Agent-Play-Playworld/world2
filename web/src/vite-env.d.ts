/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OCCUPANCY_ORIGIN?: string;
}

declare module "node:fs" {
  export function readFileSync(filePath: string, encoding: string): string;
}

declare module "node:path" {
  export function join(...segments: string[]): string;
  export function dirname(filePath: string): string;
}

declare module "node:url" {
  export function fileURLToPath(fileUrl: string | URL): string;
}

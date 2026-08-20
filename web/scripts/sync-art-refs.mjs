import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.resolve(webRoot, "../art/refs");
const destination = path.resolve(webRoot, "public/art/refs");

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

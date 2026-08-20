import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import {
  WORLD2_SEO_STATIC_FILES,
  world2SeoFileBody,
} from "./src/lib/world2-seo.ts";

const webRoot = path.dirname(fileURLToPath(import.meta.url));

const world2SeoPlugin = (): Plugin => {
  return {
    name: "world2-seo-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0] ?? "";
        const body = world2SeoFileBody(pathname);
        const contentType = WORLD2_SEO_STATIC_FILES[pathname];
        if (body === null || contentType === undefined) {
          next();
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        res.end(body);
      });
    },
    generateBundle() {
      for (const pathname of Object.keys(WORLD2_SEO_STATIC_FILES)) {
        const body = world2SeoFileBody(pathname);
        if (body === null) {
          continue;
        }
        this.emitFile({
          type: "asset",
          fileName: pathname.slice(1),
          source: body,
        });
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), world2SeoPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(webRoot, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: false,
  },
});

import { z } from "zod";

export const AppRouteIdSchema = z.enum([
  "landing",
  "interest",
  "assets",
  "game-shell",
  "developers",
  "webgl",
  "rust",
  "c",
  "visage",
]);

export type AppRouteId = z.infer<typeof AppRouteIdSchema>;

export const AppRouteSchema = z.object({
  id: AppRouteIdSchema,
  path: z.string().min(1),
  label: z.string().min(1),
});

export type AppRoute = z.infer<typeof AppRouteSchema>;

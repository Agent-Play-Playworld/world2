import { z } from "zod";

export const InkLevelSchema = z.enum(["low", "high"]);
export type InkLevel = z.infer<typeof InkLevelSchema>;

export const LifeLevelSchema = z.enum(["low", "high"]);
export type LifeLevel = z.infer<typeof LifeLevelSchema>;

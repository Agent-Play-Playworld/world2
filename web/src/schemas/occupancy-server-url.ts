import { z } from "zod";

export const OccupancyServerUrlSchema = z
  .string()
  .url()
  .transform((value) => value.replace(/\/$/, ""));

export type OccupancyServerUrl = z.infer<typeof OccupancyServerUrlSchema>;

import { z } from "zod";

export const EnteredWorldSchema = z.object({
  sid: z.string().min(1),
  nodeId: z.string().min(1),
  snapshot: z.unknown(),
  passw: z.string().min(1).optional(),
});

export type EnteredWorld = z.infer<typeof EnteredWorldSchema>;

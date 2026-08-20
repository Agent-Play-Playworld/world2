import { z } from "zod";

export const RestorePapersPreviewSchema = z.object({
  fileName: z.string().min(1),
  nodeId: z.string().min(1),
  serverUrl: z.string().url(),
});

export type RestorePapersPreview = z.infer<typeof RestorePapersPreviewSchema>;
